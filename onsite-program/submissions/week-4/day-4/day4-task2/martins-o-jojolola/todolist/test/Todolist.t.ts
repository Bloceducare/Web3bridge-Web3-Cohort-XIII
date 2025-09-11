import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { TodoList } from "../typechain-types";

describe("TodoList", function () {
    let todoList: TodoList;
    let owner: Signer;
    let addr1: Signer;
    let addr2: Signer;
    let addr3: Signer;
    let addrs: Signer[];

    // Status enum mapping
    const STATUS = {
        Pending: 0,
        Completed: 1
    };

    beforeEach(async function () {
        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

        const TodoListFactory = await ethers.getContractFactory("TodoList");
        todoList = await TodoListFactory.deploy();
        await todoList.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should deploy successfully", async function () {
            expect(await todoList.getAddress()).to.be.properAddress;
        });

        it("Should have no todos initially", async function () {
            const allTodos = await todoList.getTodos();
            expect(allTodos.length).to.equal(0);
        });
    });

    describe("Creating Todos", function () {
        it("Should create a new todo successfully", async function () {
            const todoAddress = await addr1.getAddress();
            const title = "Buy groceries";
            const description = "Need to buy milk, bread, and eggs";

            await todoList.createTodo(todoAddress, title, description);

            const todo = await todoList.getTodo(todoAddress);
            expect(todo.title).to.equal(title);
            expect(todo.description).to.equal(description);
            expect(todo.status).to.equal(STATUS.Pending);
            expect(todo.creator).to.equal(await owner.getAddress());
        });

        it("Should add todo address to the array", async function () {
            const todoAddress = await addr1.getAddress();

            await todoList.createTodo(
                todoAddress,
                "Test Todo",
                "Test Description"
            );

            const allTodos = await todoList.getTodos();
            expect(allTodos.length).to.equal(1);
            expect(allTodos[0].title).to.equal("Test Todo");
        });

        it("Should create multiple todos with different addresses", async function () {
            const addr1Address = await addr1.getAddress();
            const addr2Address = await addr2.getAddress();

            await todoList.createTodo(
                addr1Address,
                "First Todo",
                "First Description"
            );

            await todoList.createTodo(
                addr2Address,
                "Second Todo",
                "Second Description"
            );

            const allTodos = await todoList.getTodos();
            expect(allTodos.length).to.equal(2);
            expect(allTodos[0].title).to.equal("First Todo");
            expect(allTodos[1].title).to.equal("Second Todo");
        });

        it("Should set creator as msg.sender", async function () {
            const todoAddress = await addr1.getAddress();
            const ownerAddress = await owner.getAddress();

            await todoList.createTodo(
                todoAddress,
                "Owner Todo",
                "Created by owner"
            );

            const todo = await todoList.getTodo(todoAddress);
            expect(todo.creator).to.equal(ownerAddress);
        });

        it("Should allow different users to create todos", async function () {
            const todoAddress1 = await addr1.getAddress();
            const todoAddress2 = await addr2.getAddress();
            const user1Address = await addr1.getAddress();
            const user2Address = await addr2.getAddress();

            // Owner creates a todo
            await todoList.createTodo(
                todoAddress1,
                "Owner Todo",
                "Created by owner"
            );

            // User 1 creates a todo
            await todoList.connect(addr1).createTodo(
                todoAddress2,
                "User1 Todo",
                "Created by user1"
            );

            const ownerTodo = await todoList.getTodo(todoAddress1);
            const user1Todo = await todoList.getTodo(todoAddress2);

            expect(ownerTodo.creator).to.equal(await owner.getAddress());
            expect(user1Todo.creator).to.equal(user1Address);
        });

        it("Should revert when creating todo with empty title", async function () {
            const todoAddress = await addr1.getAddress();

            await expect(
                todoList.createTodo(todoAddress, "", "Valid description")
            ).to.be.revertedWithCustomError(todoList, "EmptyTodoTitle")
                .withArgs("Todo title cannot be empty");
        });

        it("Should revert when creating todo with empty description", async function () {
            const todoAddress = await addr1.getAddress();

            await expect(
                todoList.createTodo(todoAddress, "Valid title", "")
            ).to.be.revertedWithCustomError(todoList, "EmptyTodoDescription")
                .withArgs("Todo description cannot be empty");
        });

        it("Should revert when creating todo with same address twice", async function () {
            const todoAddress = await addr1.getAddress();

            // Create first todo
            await todoList.createTodo(
                todoAddress,
                "First Todo",
                "First Description"
            );

            // Try to create second todo with same address
            await expect(
                todoList.createTodo(todoAddress, "Second Todo", "Second Description")
            ).to.be.revertedWithCustomError(todoList, "TodoAlreadyExists")
                .withArgs("Todo already exists");
        });
    });

    describe("Updating Todos", function () {
        let todoAddress: string;

        beforeEach(async function () {
            todoAddress = await addr1.getAddress();
            await todoList.createTodo(
                todoAddress,
                "Original Title",
                "Original Description"
            );
        });

        it("Should update existing todo successfully", async function () {
            const newTitle = "Updated Title";
            const newDescription = "Updated Description";

            await todoList.updateTodo(todoAddress, newTitle, newDescription);

            const todo = await todoList.getTodo(todoAddress);
            expect(todo.title).to.equal(newTitle);
            expect(todo.description).to.equal(newDescription);
            expect(todo.status).to.equal(STATUS.Pending); // Status should remain unchanged
            expect(todo.creator).to.equal(await owner.getAddress()); // Creator should remain unchanged
        });

        it("Should revert when updating non-existent todo", async function () {
            const nonExistentAddress = await addr2.getAddress();

            await expect(
                todoList.updateTodo(nonExistentAddress, "New Title", "New Description")
            ).to.be.revertedWithCustomError(todoList, "TodoNotFound")
                .withArgs("Todo not found");
        });

        it("Should revert when non-creator tries to update", async function () {
            await expect(
                todoList.connect(addr1).updateTodo(todoAddress, "Hacked Title", "Hacked Description")
            ).to.be.revertedWithCustomError(todoList, "UnauthorizedAccess")
                .withArgs("Only creator can modify this todo");
        });

        it("Should revert when updating with empty title", async function () {
            await expect(
                todoList.updateTodo(todoAddress, "", "Valid description")
            ).to.be.revertedWithCustomError(todoList, "EmptyTodoTitle")
                .withArgs("Todo title cannot be empty");
        });

        it("Should revert when updating with empty description", async function () {
            await expect(
                todoList.updateTodo(todoAddress, "Valid title", "")
            ).to.be.revertedWithCustomError(todoList, "EmptyTodoDescription")
                .withArgs("Todo description cannot be empty");
        });

        it("Should allow creator to update their own todo", async function () {
            const user1Address = await addr1.getAddress();
            const user1TodoAddress = await addr2.getAddress();

            // User 1 creates their own todo
            await todoList.connect(addr1).createTodo(
                user1TodoAddress,
                "User1 Todo",
                "User1 Description"
            );

            // User 1 should be able to update their own todo
            await todoList.connect(addr1).updateTodo(
                user1TodoAddress,
                "Updated by User1",
                "Updated description by User1"
            );

            const todo = await todoList.getTodo(user1TodoAddress);
            expect(todo.title).to.equal("Updated by User1");
            expect(todo.description).to.equal("Updated description by User1");
        });
    });

    describe("Toggling Todo Status", function () {
        let todoAddress: string;

        beforeEach(async function () {
            todoAddress = await addr1.getAddress();
            await todoList.createTodo(
                todoAddress,
                "Test Todo",
                "Test Description"
            );
        });

        it("Should toggle status from Pending to Completed", async function () {
            // Initially should be Pending
            let todo = await todoList.getTodo(todoAddress);
            expect(todo.status).to.equal(STATUS.Pending);

            // Toggle to Completed
            await todoList.toggleTodoStatus(todoAddress);

            todo = await todoList.getTodo(todoAddress);
            expect(todo.status).to.equal(STATUS.Completed);
        });

        it("Should toggle status from Completed to Pending", async function () {
            // First toggle to Completed
            await todoList.toggleTodoStatus(todoAddress);

            let todo = await todoList.getTodo(todoAddress);
            expect(todo.status).to.equal(STATUS.Completed);

            // Toggle back to Pending
            await todoList.toggleTodoStatus(todoAddress);

            todo = await todoList.getTodo(todoAddress);
            expect(todo.status).to.equal(STATUS.Pending);
        });

        it("Should toggle status multiple times", async function () {
            for (let i = 0; i < 5; i++) {
                await todoList.toggleTodoStatus(todoAddress);

                const todo = await todoList.getTodo(todoAddress);
                const expectedStatus = i % 2 === 0 ? STATUS.Completed : STATUS.Pending;
                expect(todo.status).to.equal(expectedStatus);
            }
        });

        it("Should revert when toggling non-existent todo", async function () {
            const nonExistentAddress = await addr2.getAddress();

            await expect(
                todoList.toggleTodoStatus(nonExistentAddress)
            ).to.be.revertedWithCustomError(todoList, "TodoNotFound")
                .withArgs("Todo not found");
        });

        it("Should revert when non-creator tries to toggle", async function () {
            await expect(
                todoList.connect(addr1).toggleTodoStatus(todoAddress)
            ).to.be.revertedWithCustomError(todoList, "UnauthorizedAccess")
                .withArgs("Only creator can modify this todo");
        });

        it("Should preserve other todo properties when toggling", async function () {
            const originalTodo = await todoList.getTodo(todoAddress);

            await todoList.toggleTodoStatus(todoAddress);

            const toggledTodo = await todoList.getTodo(todoAddress);
            expect(toggledTodo.title).to.equal(originalTodo.title);
            expect(toggledTodo.description).to.equal(originalTodo.description);
            expect(toggledTodo.creator).to.equal(originalTodo.creator);
        });
    });

    describe("Getting Todos", function () {
        it("Should return empty array when no todos exist", async function () {
            const allTodos = await todoList.getTodos();
            expect(allTodos.length).to.equal(0);
        });

        it("Should return all todos correctly", async function () {
            const addresses = await Promise.all([addr1, addr2, addr3].map(signer => signer.getAddress()));
            const titles = ["First Todo", "Second Todo", "Third Todo"];
            const descriptions = ["First Description", "Second Description", "Third Description"];

            // Add multiple todos
            for (let i = 0; i < 3; i++) {
                await todoList.createTodo(addresses[i], titles[i], descriptions[i]);
            }

            const allTodos = await todoList.getTodos();

            expect(allTodos.length).to.equal(3);
            for (let i = 0; i < 3; i++) {
                expect(allTodos[i].title).to.equal(titles[i]);
                expect(allTodos[i].description).to.equal(descriptions[i]);
                expect(allTodos[i].status).to.equal(STATUS.Pending);
            }
        });

        it("Should maintain correct order of todos", async function () {
            const addresses = await Promise.all([addr1, addr2, addr3].map(signer => signer.getAddress()));

            // Add todos in specific order
            for (let i = 0; i < 3; i++) {
                await todoList.createTodo(addresses[i], `Todo ${i}`, `Description ${i}`);
            }

            const allTodos = await todoList.getTodos();

            for (let i = 0; i < 3; i++) {
                expect(allTodos[i].title).to.equal(`Todo ${i}`);
            }
        });

        it("Should return todos with different statuses", async function () {
            const addresses = await Promise.all([addr1, addr2].map(signer => signer.getAddress()));

            // Create two todos
            await todoList.createTodo(addresses[0], "Pending Todo", "Pending Description");
            await todoList.createTodo(addresses[1], "Completed Todo", "Completed Description");

            // Toggle second todo to completed
            await todoList.toggleTodoStatus(addresses[1]);

            const allTodos = await todoList.getTodos();
            expect(allTodos.length).to.equal(2);
            expect(allTodos[0].status).to.equal(STATUS.Pending);
            expect(allTodos[1].status).to.equal(STATUS.Completed);
        });
    });

    describe("Getting Single Todo", function () {
        let todoAddress: string;

        beforeEach(async function () {
            todoAddress = await addr1.getAddress();
            await todoList.createTodo(
                todoAddress,
                "Test Todo",
                "Test Description"
            );
        });

        it("Should return correct todo details", async function () {
            const todo = await todoList.getTodo(todoAddress);

            expect(todo.title).to.equal("Test Todo");
            expect(todo.description).to.equal("Test Description");
            expect(todo.status).to.equal(STATUS.Pending);
            expect(todo.creator).to.equal(await owner.getAddress());
        });

        it("Should revert when getting non-existent todo", async function () {
            const nonExistentAddress = await addr2.getAddress();

            await expect(
                todoList.getTodo(nonExistentAddress)
            ).to.be.revertedWithCustomError(todoList, "TodoNotFound")
                .withArgs("Todo not found");
        });

        it("Should return updated todo details after modification", async function () {
            // Update the todo
            await todoList.updateTodo(todoAddress, "Updated Title", "Updated Description");
            await todoList.toggleTodoStatus(todoAddress);

            const todo = await todoList.getTodo(todoAddress);
            expect(todo.title).to.equal("Updated Title");
            expect(todo.description).to.equal("Updated Description");
            expect(todo.status).to.equal(STATUS.Completed);
        });
    });

    describe("Deleting Todos", function () {
        let todoAddress: string;

        beforeEach(async function () {
            todoAddress = await addr1.getAddress();
            await todoList.createTodo(
                todoAddress,
                "Test Todo",
                "Test Description"
            );
        });

        it("Should delete todo successfully", async function () {
            // Verify todo exists
            const todoBefore = await todoList.getTodo(todoAddress);
            expect(todoBefore.title).to.equal("Test Todo");

            // Delete todo
            await todoList.deleteTodo(todoAddress);

            // Verify todo no longer exists
            await expect(
                todoList.getTodo(todoAddress)
            ).to.be.revertedWithCustomError(todoList, "TodoNotFound");
        });

        it("Should remove todo from todos array", async function () {
            const addr2Address = await addr2.getAddress();

            // Add second todo
            await todoList.createTodo(addr2Address, "Second Todo", "Second Description");

            // Verify we have 2 todos
            let allTodos = await todoList.getTodos();
            expect(allTodos.length).to.equal(2);

            // Delete first todo
            await todoList.deleteTodo(todoAddress);

            // Verify we now have 1 todo
            allTodos = await todoList.getTodos();
            expect(allTodos.length).to.equal(1);
            expect(allTodos[0].title).to.equal("Second Todo");
        });

        it("Should handle deleting from middle of array", async function () {
            const addr2Address = await addr2.getAddress();
            const addr3Address = await addr3.getAddress();

            // Add more todos
            await todoList.createTodo(addr2Address, "Second Todo", "Second Description");
            await todoList.createTodo(addr3Address, "Third Todo", "Third Description");

            // Verify we have 3 todos
            let allTodos = await todoList.getTodos();
            expect(allTodos.length).to.equal(3);

            // Delete middle todo
            await todoList.deleteTodo(addr2Address);

            // Verify array integrity
            allTodos = await todoList.getTodos();
            expect(allTodos.length).to.equal(2);

            // Check that the remaining todos are correct
            const remainingTitles = allTodos.map(todo => todo.title);
            expect(remainingTitles).to.include("Test Todo");
            expect(remainingTitles).to.include("Third Todo");
            expect(remainingTitles).to.not.include("Second Todo");
        });

        it("Should delete all todos successfully", async function () {
            const addr2Address = await addr2.getAddress();

            // Add second todo
            await todoList.createTodo(addr2Address, "Second Todo", "Second Description");

            // Delete both todos
            await todoList.deleteTodo(todoAddress);
            await todoList.deleteTodo(addr2Address);

            // Verify no todos remain
            const allTodos = await todoList.getTodos();
            expect(allTodos.length).to.equal(0);
        });

        it("Should revert when deleting non-existent todo", async function () {
            const nonExistentAddress = await addr2.getAddress();

            await expect(
                todoList.deleteTodo(nonExistentAddress)
            ).to.be.revertedWithCustomError(todoList, "TodoNotFound")
                .withArgs("Todo not found");
        });

        it("Should revert when non-creator tries to delete", async function () {
            await expect(
                todoList.connect(addr1).deleteTodo(todoAddress)
            ).to.be.revertedWithCustomError(todoList, "UnauthorizedAccess")
                .withArgs("Only creator can modify this todo");
        });

        it("Should allow creator to delete their own todo", async function () {
            const user1Address = await addr1.getAddress();
            const user1TodoAddress = await addr2.getAddress();

            // User 1 creates their own todo
            await todoList.connect(addr1).createTodo(
                user1TodoAddress,
                "User1 Todo",
                "User1 Description"
            );

            // User 1 should be able to delete their own todo
            await todoList.connect(addr1).deleteTodo(user1TodoAddress);

            // Verify todo is deleted
            await expect(
                todoList.getTodo(user1TodoAddress)
            ).to.be.revertedWithCustomError(todoList, "TodoNotFound");
        });
    });

    describe("Access Control and Security", function () {
        it("Should enforce creator-only access for all modification operations", async function () {
            const todoAddress = await addr1.getAddress();
            const user1TodoAddress = await addr2.getAddress();

            // Owner creates a todo
            await todoList.createTodo(todoAddress, "Owner Todo", "Owner Description");

            // User1 creates their own todo
            await todoList.connect(addr1).createTodo(
                user1TodoAddress,
                "User1 Todo",
                "User1 Description"
            );

            // User1 should not be able to modify owner's todo
            await expect(
                todoList.connect(addr1).updateTodo(todoAddress, "Hacked", "Hacked")
            ).to.be.revertedWithCustomError(todoList, "UnauthorizedAccess");

            await expect(
                todoList.connect(addr1).toggleTodoStatus(todoAddress)
            ).to.be.revertedWithCustomError(todoList, "UnauthorizedAccess");

            await expect(
                todoList.connect(addr1).deleteTodo(todoAddress)
            ).to.be.revertedWithCustomError(todoList, "UnauthorizedAccess");

            // Owner should not be able to modify user1's todo
            await expect(
                todoList.updateTodo(user1TodoAddress, "Hacked", "Hacked")
            ).to.be.revertedWithCustomError(todoList, "UnauthorizedAccess");

            await expect(
                todoList.toggleTodoStatus(user1TodoAddress)
            ).to.be.revertedWithCustomError(todoList, "UnauthorizedAccess");

            await expect(
                todoList.deleteTodo(user1TodoAddress)
            ).to.be.revertedWithCustomError(todoList, "UnauthorizedAccess");
        });

        it("Should allow multiple users to manage their own todos independently", async function () {
            const user1TodoAddress = await addr1.getAddress();
            const user2TodoAddress = await addr2.getAddress();

            // User1 creates and manages their todo
            await todoList.connect(addr1).createTodo(
                user1TodoAddress,
                "User1 Todo",
                "User1 Description"
            );

            // User2 creates and manages their todo
            await todoList.connect(addr2).createTodo(
                user2TodoAddress,
                "User2 Todo",
                "User2 Description"
            );

            // Both users can manage their own todos
            await todoList.connect(addr1).updateTodo(
                user1TodoAddress,
                "Updated User1 Todo",
                "Updated User1 Description"
            );

            await todoList.connect(addr2).toggleTodoStatus(user2TodoAddress);

            // Verify changes
            const user1Todo = await todoList.getTodo(user1TodoAddress);
            const user2Todo = await todoList.getTodo(user2TodoAddress);

            expect(user1Todo.title).to.equal("Updated User1 Todo");
            expect(user2Todo.status).to.equal(STATUS.Completed);
        });
    });

    describe("Edge Cases and Data Integrity", function () {
        it("Should handle very long titles and descriptions", async function () {
            const longTitle = "a".repeat(1000);
            const longDescription = "b".repeat(2000);
            const todoAddress = await addr1.getAddress();

            await todoList.createTodo(todoAddress, longTitle, longDescription);

            const todo = await todoList.getTodo(todoAddress);
            expect(todo.title).to.equal(longTitle);
            expect(todo.description).to.equal(longDescription);
        });

        it("Should handle special characters in titles and descriptions", async function () {
            const specialTitle = "TODO: Fix 'urgent' issue #123 @home 🏠";
            const specialDescription = "Need to fix the issue mentioned in ticket #123. It's 'urgent' & requires immediate attention! Contact @support.";
            const todoAddress = await addr1.getAddress();

            await todoList.createTodo(todoAddress, specialTitle, specialDescription);

            const todo = await todoList.getTodo(todoAddress);
            expect(todo.title).to.equal(specialTitle);
            expect(todo.description).to.equal(specialDescription);
        });

        it("Should maintain data integrity after multiple operations", async function () {
            const todoAddress = await addr1.getAddress();
            const creatorAddress = await owner.getAddress();

            // Create todo
            await todoList.createTodo(todoAddress, "Original", "Original Description");

            // Perform multiple operations
            await todoList.updateTodo(todoAddress, "Updated", "Updated Description");
            await todoList.toggleTodoStatus(todoAddress);
            await todoList.toggleTodoStatus(todoAddress);

            const todo = await todoList.getTodo(todoAddress);
            expect(todo.title).to.equal("Updated");
            expect(todo.description).to.equal("Updated Description");
            expect(todo.status).to.equal(STATUS.Pending);
            expect(todo.creator).to.equal(creatorAddress);
        });
    });

    describe("Gas Optimization Tests", function () {
        it("Should track gas usage for creating todos", async function () {
            const todoAddress = await addr1.getAddress();

            const tx = await todoList.createTodo(
                todoAddress,
                "Test Todo",
                "Test Description"
            );

            const receipt = await tx.wait();
            console.log(`Gas used for creating todo: ${receipt?.gasUsed}`);

            expect(receipt?.gasUsed).to.be.lessThan(200000);
        });

        it("Should track gas usage for updating todos", async function () {
            const todoAddress = await addr1.getAddress();

            // Create todo first
            await todoList.createTodo(todoAddress, "Original", "Original Description");

            // Update todo
            const tx = await todoList.updateTodo(
                todoAddress,
                "Updated",
                "Updated Description"
            );

            const receipt = await tx.wait();
            console.log(`Gas used for updating todo: ${receipt?.gasUsed}`);

            expect(receipt?.gasUsed).to.be.lessThan(100000);
        });

        it("Should track gas usage for deleting todos", async function () {
            const todoAddress = await addr1.getAddress();

            // Create todo first
            await todoList.createTodo(todoAddress, "To Delete", "Will be deleted");

            // Delete todo
            const tx = await todoList.deleteTodo(todoAddress);

            const receipt = await tx.wait();
            console.log(`Gas used for deleting todo: ${receipt?.gasUsed}`);

            expect(receipt?.gasUsed).to.be.lessThan(100000);
        });

        it("Should compare gas usage for different array sizes", async function () {
            const addresses = await Promise.all(
                [addr1, addr2, addr3].map(signer => signer.getAddress())
            );

            // Add multiple todos
            for (let i = 0; i < addresses.length; i++) {
                await todoList.createTodo(
                    addresses[i],
                    `Todo ${i}`,
                    `Description ${i}`
                );
            }

            // Test gas usage for getTodos with different array sizes
            const allTodos = await todoList.getTodos();
            console.log(`Retrieved ${allTodos.length} todos`);

            expect(allTodos.length).to.equal(3);
        });
    });

    describe("Integration and Workflow Tests", function () {
        it("Should handle complete todo lifecycle", async function () {
            const todoAddress = await addr1.getAddress();

            // Create todo
            await todoList.createTodo(
                todoAddress,
                "Complete Project",
                "Finish the blockchain project by Friday"
            );

            // Verify initial state
            let todo = await todoList.getTodo(todoAddress);
            expect(todo.status).to.equal(STATUS.Pending);

            // Update todo
            await todoList.updateTodo(
                todoAddress,
                "Complete Project (Updated)",
                "Finish the blockchain project by Friday - Added tests"
            );

            // Toggle to completed
            await todoList.toggleTodoStatus(todoAddress);

            // Verify final state
            todo = await todoList.getTodo(todoAddress);
            expect(todo.title).to.equal("Complete Project (Updated)");
            expect(todo.description).to.equal("Finish the blockchain project by Friday - Added tests");
            expect(todo.status).to.equal(STATUS.Completed);

            // Delete completed todo
            await todoList.deleteTodo(todoAddress);

            // Verify deletion
            await expect(
                todoList.getTodo(todoAddress)
            ).to.be.revertedWithCustomError(todoList, "TodoNotFound");
        });

        it("Should handle multiple users with complex workflows", async function () {
            const user1TodoAddr = await addr1.getAddress();
            const user2TodoAddr = await addr2.getAddress();
            const user3TodoAddr = await addr3.getAddress();

            // User 1 creates multiple todos
            await todoList.connect(addr1).createTodo(
                user1TodoAddr,
                "User1 Task 1",
                "First task for user 1"
            );

            // User 2 creates and completes a todo
            await todoList.connect(addr2).createTodo(
                user2TodoAddr,
                "User2 Task 1",
                "First task for user 2"
            );
            await todoList.connect(addr2).toggleTodoStatus(user2TodoAddr);

            // User 3 creates and then deletes a todo
            await todoList.connect(addr3).createTodo(
                user3TodoAddr,
                "User3 Task 1",
                "First task for user 3"
            );
            await todoList.connect(addr3).deleteTodo(user3TodoAddr);

            // Verify final state
            const allTodos = await todoList.getTodos();
            expect(allTodos.length).to.equal(2);

            const user1Todo = allTodos.find(todo => todo.title === "User1 Task 1");
            const user2Todo = allTodos.find(todo => todo.title === "User2 Task 1");

            expect(user1Todo?.status).to.equal(STATUS.Pending);
            expect(user2Todo?.status).to.equal(STATUS.Completed);

            // User3's todo should not exist
            const user3Todo = allTodos.find(todo => todo.title === "User3 Task 1");
            expect(user3Todo).to.be.undefined;
        });
    });
});