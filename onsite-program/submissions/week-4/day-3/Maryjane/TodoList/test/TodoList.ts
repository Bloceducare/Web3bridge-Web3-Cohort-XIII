import { ethers } from "hardhat";
import { expect } from "chai";

describe("TodoList", function () {
  let todoList: any;
  let user: any;

  beforeEach(async function () {
    const [signer] = await ethers.getSigners();
    user = signer;

    const TodoList = await ethers.getContractFactory("TodoList");
    todoList = await TodoList.deploy();
    await todoList.waitForDeployment();
  });

  it("should create a new to-do item", async function () {
    await todoList.connect(user).createTodo("Task 1", "Description 1");

    const todo = await todoList.todos(1);
    expect(todo.todoId).to.equal(1n);
    expect(todo.todoTitle).to.equal("Task 1");
    expect(todo.todoDescription).to.equal("Description 1");
    expect(todo.isCompleted).to.equal(false);

    const todoIds = await todoList.todoIdList();
    expect(todoIds.length).to.equal(1);
    expect(todoIds[0]).to.equal(1n);
  });

  it("should update an existing to-do item", async function () {
    await todoList.connect(user).createTodo("Task 1", "Description 1");
    await todoList.connect(user).updateTodo(1, "Updated Task", "Updated Description");

    const todo = await todoList.todos(1);
    expect(todo.todoTitle).to.equal("Updated Task");
    expect(todo.todoDescription).to.equal("Updated Description");
    expect(todo.isCompleted).to.equal(false);
  });

  it("should revert when updating a non-existent to-do item", async function () {
    await expect(todoList.connect(user).updateTodo(1, "Task", "Description"))
      .to.be.revertedWith("TODO_NOT_FOUND");
  });

  it("should toggle the status of a to-do item", async function () {
    await todoList.connect(user).createTodo("Task 1", "Description 1");

    // Toggle ON
    await todoList.connect(user).toggleTodoStatus(1);
    let todo = await todoList.todos(1);
    expect(todo.isCompleted).to.equal(true);

    // Toggle OFF
    await todoList.connect(user).toggleTodoStatus(1);
    todo = await todoList.todos(1);
    expect(todo.isCompleted).to.equal(false);
  });

  it("should revert when toggling a non-existent to-do item", async function () {
    await expect(todoList.connect(user).toggleTodoStatus(1))
      .to.be.revertedWith("TODO_NOT_FOUND");
  });

  it("should return all to-do items", async function () {
    await todoList.connect(user).createTodo("Task 1", "Description 1");
    await todoList.connect(user).createTodo("Task 2", "Description 2");

    const todos = await todoList.getAllTodos();
    expect(todos.length).to.equal(2);

    expect(todos[0].todoId).to.equal(1n);
    expect(todos[0].todoTitle).to.equal("Task 1");
    expect(todos[0].todoDescription).to.equal("Description 1");
    expect(todos[0].isCompleted).to.equal(false);

    expect(todos[1].todoId).to.equal(2n);
    expect(todos[1].todoTitle).to.equal("Task 2");
    expect(todos[1].todoDescription).to.equal("Description 2");
    expect(todos[1].isCompleted).to.equal(false);
  });

  it("should delete a to-do item", async function () {
    await todoList.connect(user).createTodo("Task 1", "Description 1");
    await todoList.connect(user).createTodo("Task 2", "Description 2");

    await todoList.connect(user).deleteTodo(1);

    const todo = await todoList.todos(1);
    expect(todo.todoId).to.equal(0n); // Soft-deleted

    const todoIds = await todoList.todoIdList();
    expect(todoIds.length).to.equal(1);
    expect(todoIds[0]).to.equal(2n);

    const todos = await todoList.getAllTodos();
    expect(todos.length).to.equal(1);
    expect(todos[0].todoId).to.equal(2n);
  });

  it("should revert when deleting a non-existent to-do item", async function () {
    await expect(todoList.connect(user).deleteTodo(1))
      .to.be.revertedWith("TODO_NOT_FOUND");
  });
});