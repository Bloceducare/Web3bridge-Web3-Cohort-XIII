import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("TodoList Test", function () {
  async function deployedTodoList() {
    const [admin, otherAccount] = await hre.ethers.getSigners();

    const TodoList = await hre.ethers.getContractFactory("TodoList");

    const todoList = await TodoList.deploy();

    return { todoList, admin, otherAccount };
  }

  describe("Create Todo", function () {
    it("this is to create todo", async function () {
      const { todoList, otherAccount } = await loadFixture(deployedTodoList);

      const title = "Gym Task";
      const description = "this is to stay healthy";
      const address = otherAccount.address;

      await todoList.create_todo(title, description, address);

      const showTask = await todoList.show_todo();

      const getTask = showTask[0];

      expect(getTask.tittle).to.equals(title);
    });
  });

  describe("Update Todo", function () {
    it("Updates Written Task", async function () {
      const { todoList, otherAccount } = await loadFixture(deployedTodoList);

      const uid = 0;
      const title = "Exercises";
      const description = "this is to remain healthy";
      const address = otherAccount.address;

      await todoList.update_todo(uid, title, description, address);

      const newTask = await todoList.show_todo();

      const verifiedNewTask = newTask[0];

      expect(verifiedNewTask.todoAddress).to.equals(address);

      expect(verifiedNewTask.tittle).to.equals(title);

      expect(verifiedNewTask.description).to.equals(description);
    });
  });

  describe("Show Task", function () {
    it("Display User Task", async function () {
      const { todoList, otherAccount } = await loadFixture(deployedTodoList);

      const title = "Gym Task";
      const description = "this is to stay healthy";
      const address = otherAccount.address;

      await todoList.create_todo(title, description, address);

      const show_user = await todoList.show_todo();

      const show_task = show_user[0];

      expect(show_task.description).to.equals(show_task.description);
    });
  });

  describe("Delete Task", function () {
    it("Delete User Task", async function () {
      const { todoList, otherAccount } = await loadFixture(deployedTodoList);

      const title = "Gym Task";
      const description = "this is to stay healthy";
      const address = otherAccount.address;

      await todoList.create_todo(title, description, address);

      const show_user = await todoList.remove_todo(otherAccount.address, 0);

      expect(show_user).to.equals(show_user);
    });
  });

  describe("Change Task Status", function () {
    it("Update Task Status", async function () {
      const { todoList, otherAccount } = await loadFixture(deployedTodoList);

      const title = "Gym Task";
      const description = "this is to stay healthy";
      const address = otherAccount.address;
      const status = true;

      await todoList.update_todo(0, title, description, address);

      await todoList.change_task_status(otherAccount.address);

      const statusData = await todoList.show_todo();

      const checker = !statusData[0].status;

      const newStatus = true;

      expect(newStatus).to.equals(checker);
    });
  });
});
