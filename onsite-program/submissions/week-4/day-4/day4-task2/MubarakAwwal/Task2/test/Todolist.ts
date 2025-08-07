import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect, use } from "chai";
import { ethers } from "hardhat";

describe("todoList Contract", function () {
  async function deployTodoFixture() {
    const [owner, user1] = await ethers.getSigners();
    const Todo = await ethers.getContractFactory("todoList");
    const todo = await Todo.deploy();
    return { todo, owner, user1 };
  }
  it("Should create a new todo", async function () {
    const { todo } = await loadFixture(deployTodoFixture);
    await todo.createTodo("task1", "do task1");
    await todo.createTodo("task2", "do task2");
    const todos = await todo.getTodos();
    expect(todos.length).to.equal(2);
    expect(todos[0].title).to.equal("task1");
    expect(todos[0].description).to.equal("do task1");
    expect(todos[1].title).to.equal("task2");
    expect(todos[1].description).to.equal("do task2");
  });
  it("Should update a todo", async function () {
    const { todo } = await loadFixture(deployTodoFixture);
    await todo.createTodo("task1", "do task1");
    await todo.updateTodo(0,"newTask", "newDesc");
    const todos = await todo.getTodos();
    expect(todos[0].title).to.equal("newTask");
    expect(todos[0].description).to.equal("newDesc");
  });
  it("Should revert when trying to update a non-existent todo", async function () {
  const { todo } = await loadFixture(deployTodoFixture);
  await expect(todo.updateTodo(0, "New Title", "New Desc")).to.be.revertedWith("Invalid index");
});
it("Should revert when trying to toggle a non-exitstent todo",async function(){
  const{todo}= await loadFixture(deployTodoFixture);
  await expect(todo.toggleTodo(0)).to.be.revertedWith("Invalid index")
})
it("Should revert when trying to toggle a non-exitstent todo",async function(){
  const{todo}= await loadFixture(deployTodoFixture);
  await expect(todo.getSpecificTodo(0)).to.be.revertedWith("Invalid index")
})
it("Should revert when trying to delete a non-exitstent todo",async function(){
  const{todo}= await loadFixture(deployTodoFixture);
  await expect(todo.deleteTodo(0)).to.be.revertedWith("Invalid index")
})
  it("Should delete a todo", async function () {
    const { todo } = await loadFixture(deployTodoFixture);
    await todo.createTodo("task1", "do task1");
    await todo.createTodo("task2", "do task2");
    await todo.deleteTodo(0);
    const todos = await todo.getTodos();
    expect(todos.length).to.equal(1)
    expect(todos[0].title).to.equal("task2");
    expect(todos[0].description).to.equal("do task2");
  });
  it("Should toggle a todo", async function(){
    const { todo } = await loadFixture(deployTodoFixture);
    await todo.createTodo("task1","do task1")
    await todo.toggleTodo(0);
    const todos=await todo.getTodos();
    expect(todos[0].status).to.equal(true);
  })
  it("Should get a specific todo", async function(){
    const { todo } = await loadFixture(deployTodoFixture);
    await todo.createTodo("task1","do task1")
    await todo.createTodo("task2","do task2")
    const specifictodo= await todo.getSpecificTodo(0);
    expect(specifictodo.title).to.equal("task1");
    expect(specifictodo.description).to.equal("do task1");
  })
  it("Should check if a task if complete or not", async function(){
     const { todo } = await loadFixture(deployTodoFixture);
    await todo.createTodo("task1","do task1");
    await todo.createTodo("task2","do task2");
      await todo.toggleTodo(0);
    const checkComp= await todo.checkComplete();
    const checkIncomp= await todo.checkIncomplete();
    expect(checkComp).to.equal(1)
    expect(checkIncomp).to.equal(1)
  })
    it("Should return all todos", async function(){
     const{todo}= await loadFixture(deployTodoFixture);
        await todo.createTodo("task1","do task1");
        await todo.createTodo("task2","do task2");
        const todos= await todo.getTodos();
        expect(todos.length).to.equal(2);
  })
});
