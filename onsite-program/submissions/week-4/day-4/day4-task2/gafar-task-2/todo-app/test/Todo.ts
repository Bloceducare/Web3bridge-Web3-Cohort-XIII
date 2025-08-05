import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Deploy Todo", function () {
  async function deployTodo() {
    const [owner] = await hre.ethers.getSigners();

    const todo = await hre.ethers.getContractFactory("TodoList");
    const Todo = await todo.deploy();

    return { Todo, owner };
  }

  describe("create todo", function() {
    it("Should create a todo instance", async function () {
      const { Todo } = await loadFixture(deployTodo);
      const title = "Test Todo";
      const description = "This is a test todo item";

      await Todo.create_todo(title, description);
      const get_todos = await Todo.get_todos();

      expect(get_todos[0].title).to.be.equal(title);
      expect(get_todos[0].description).to.be.equal(description);
    })
  });

  describe("update todo", function() {
    it("should update a todo from the storage", async function() {
      const { Todo, owner } = await loadFixture(deployTodo);
      const title = "Sarah";
      const description = "This is a test todo item";

      const _new_title = "New Sarah";
      const _new_description = "This is an updated todo item";

      await Todo.create_todo(title, description);
      await Todo.update_todo(_new_title, _new_description);
      const updated_todos = await Todo.get_user_todo(owner.address);
      // console.log("Updated todos", updated_todos.title)

      expect(updated_todos.title).to.be.equal(_new_title);
      expect(updated_todos.description).to.be.equal(_new_description);
    })
  });

  describe("Update Status", function() {
    it("should update a todo Status", async function() {
      const { Todo, owner } = await loadFixture(deployTodo);
      const title = "Sarah";
      const description = "This is a test todo item";

      await Todo.create_todo(title, description);
      const initial_todo = await Todo.get_user_todo(owner.address);
      expect(initial_todo.status).to.be.false;

      await Todo.toggle_todo_status(); 
      const updated_todo = await Todo.get_user_todo(owner.address);

      console.log("Updated todo status:", updated_todo.status);
      expect(updated_todo.status).to.be.true;

      await Todo.toggle_todo_status();
      const final_todo = await Todo.get_user_todo(owner.address);
      expect(final_todo.status).to.be.false;
    })
  });

  describe("Delete a Todo Instance", function() {
    it("should delete a todo from map", async function() {
      const { Todo, owner } = await loadFixture(deployTodo);
      const title = "Sarah";
      const description = "This is a test todo item";

      await Todo.create_todo(title, description);

      await Todo.delete_todo();
      const get_todos = await Todo.get_user_todo(owner.address);
      console.log("Delete user", get_todos)
      expect(get_todos.title).to.equal("");
      expect(get_todos.description).to.equal("");
      expect(get_todos.status).to.equal(false);
    })
  })
});
