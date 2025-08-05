import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("Todo Deploy", function() {
    async function deployTodo() {
        const [owner, addr1] = await hre.ethers.getSigners(); 

        const Todo = await hre.ethers.getContractFactory("TodoList"); 
        const todo = await Todo.deploy(); 

        return { todo, owner, addr1 }; 
    }

    describe("Create Todo", function() {
        it("Should create todo", async function() {
            const { todo, owner, addr1 } = await loadFixture(deployTodo); 

            const _title = "Intentions"; 
            const _description = "One of the best color show from a nigeria artiste"; 

            await todo.connect(addr1).create_todo(_title, _description); 

            const getTodo = await todo.connect(addr1).getTodo(0); 
            expect(getTodo[0]).to.equal(_title); 
            expect(getTodo[1]).to.equal(_description); 
        })
    })

    describe("Update Todo", function() {
        it("Should update todo", async function() {
            const { todo, addr1 } = await loadFixture(deployTodo); 

            const _title = "Intentions"; 
            const _description = "One of the best color show from a nigeria artiste"; 

            await todo.connect(addr1).create_todo(_title, _description); 

            await todo.connect(addr1).update_todo(0, "Kryptonite", "This is such a great song"); 

            const getTodo = await todo.connect(addr1).getTodo(0); 
            expect(getTodo[0]).to.equal("Kryptonite"); 
            expect(getTodo[1]).to.equal("This is such a great song");
        })

        it("should revert if the index is out of range", async function() {
            const { todo, addr1 } = await loadFixture(deployTodo); 

            const _title = "Intentions"; 
            const _description = "One of the best color show from a nigeria artiste"; 

            await todo.connect(addr1).create_todo(_title, _description); 

            await expect(todo.connect(addr1).update_todo(10, "Kryptonite", "This is such a great song")).to.be.revertedWithCustomError(todo, "INDEX_OUT_OF_BOUND")
        })
    })
    describe("Delete Todo", function() {
        it("Should delete the todo", async function() {
            const { todo, addr1 } = await loadFixture(deployTodo); 

            const _title = "Intentions"; 
            const _description = "One of the best color show from a nigeria artiste"; 

            await todo.connect(addr1).create_todo(_title, _description); 

            await todo.connect(addr1).deleteTodo(0); 

            const getAllTodos = await todo.connect(addr1).getTodos();
            expect(getAllTodos.length).to.equal(0);
        })
        it("should revert if the index is out of range", async function() {
            const { todo, addr1 } = await loadFixture(deployTodo); 


            const _title = "Intentions"; 
            const _description = "One of the best color show from a nigeria artiste"; 

            await todo.connect(addr1).create_todo(_title, _description); 

            await expect(
                todo.connect(addr1).deleteTodo(10)
            ).to.be.revertedWithCustomError(todo, "INDEX_OUT_OF_BOUND");
        })
    })
    describe("getTodo", function() {
        it("Should get a single todo", async function() {
            const { todo, addr1 } = await loadFixture(deployTodo); 


            const _title = "Intentions"; 
            const _description = "One of the best color show from a nigeria artiste"; 

            await todo.connect(addr1).create_todo(_title, _description); 

            const getSingleTodo = await todo.connect(addr1).getTodo(0); 
            expect(getSingleTodo[0]).to.equal(_title); 
            expect(getSingleTodo[1]).to.equal(_description);
            expect(getSingleTodo[2]).to.equal(false); 
        })
    })
})

