import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Todo Contract", function () {
  async function deployTodoFixture() {
    const Todo = await hre.ethers.getContractFactory("Todo");
    const todo = await Todo.deploy();
    return { todo };
  }

  describe("Task Creation", function () {
    it("Should create a task for a user", async function () {
      const { todo } = await loadFixture(deployTodoFixture);
      const [owner, user1] = await hre.ethers.getSigners();

      const title = "Learn Solidity";
      const description = "Build smart contracts";

      await todo.createTask(user1.address, title, description);
      const tasks = await todo.getTasks(user1.address);

      expect(tasks.length).to.equal(1);
      expect(tasks[0].Title).to.equal(title);
      expect(tasks[0].Description).to.equal(description);
      expect(tasks[0].Status).to.equal(false);
    });
  });

  describe("Task Update", function () {
    it("Should update task title and description", async function () {
      const { todo } = await loadFixture(deployTodoFixture);
      const [_, user1] = await hre.ethers.getSigners();

      await todo.createTask(user1.address, "Old Title", "Old Description");
      await todo.updateTask(user1.address, 1, "New Title", "New Description");

      const tasks = await todo.getTasks(user1.address);
      expect(tasks[0].Title).to.equal("New Title");
      expect(tasks[0].Description).to.equal("New Description");
    });
  });

  describe("Toggle Task Status", function () {
    it("Should toggle the task's status", async function () {
      const { todo } = await loadFixture(deployTodoFixture);
      const [_, user1] = await hre.ethers.getSigners();

      await todo.createTask(user1.address, "Task", "Desc");
      await todo.toggleStatus(user1.address, 1);

      const tasks = await todo.getTasks(user1.address);
      expect(tasks[0].Status).to.equal(true);
    });
  });

  describe("Delete Task", function () {
    it("Should delete a task by ID", async function () {
      const { todo } = await loadFixture(deployTodoFixture);
      const [_, user1] = await hre.ethers.getSigners();

      await todo.createTask(user1.address, "Task", "Desc");

      await todo.deleteTask(user1.address, 1);

      const tasks = await todo.getTasks(user1.address);
      expect(tasks.length).to.equal(0);
    });
  });

  describe("Multiple Tasks", function () {
    it("Should handle multiple tasks for the same user", async function () {
      const { todo } = await loadFixture(deployTodoFixture);
      const [_, user1] = await hre.ethers.getSigners();

      await todo.createTask(user1.address, "Task 1", "Desc 1");
      await todo.createTask(user1.address, "Task 2", "Desc 2");

      const tasks = await todo.getTasks(user1.address);
      expect(tasks.length).to.equal(2);
      expect(tasks[0].Title).to.equal("Task 1");
      expect(tasks[1].Title).to.equal("Task 2");
    });
  });
});

