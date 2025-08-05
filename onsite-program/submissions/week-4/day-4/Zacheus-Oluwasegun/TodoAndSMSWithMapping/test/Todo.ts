import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { expect } from "chai";
import { TodoList } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TodoContract", () => {
  let todoList: TodoList;
  let owner: HardhatEthersSigner;
  let otherAccount: HardhatEthersSigner;

  async function deployTodoFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();
    const TodoList = await hre.ethers.getContractFactory("TodoList");
    const todoList = await TodoList.deploy();

    return { owner, otherAccount, todoList };
  }

  beforeEach("preset", async () => {
    const fixture = await loadFixture(deployTodoFixture);
    todoList = fixture.todoList;
    owner = fixture.owner;
    otherAccount = fixture.otherAccount;
  });

  describe("Todo interactions", () => {
    it("should save user todo", async () => {
      await todoList.create_todo("Food", "Eat this particular meal");
      const ownerTodos = await todoList.get_todos();
      expect(ownerTodos.length).to.be.equal(1);
    });

    it("get single todo and update status of todo", async () => {
      const title = "Food";
      const desc = "Eat this particular meal";

      await todoList.create_todo(title, desc);
      expect(todoList.get_single_todo(1)).to.be.revertedWith("Invalid index");
      expect((await todoList.get_single_todo(0))[0]).to.be.equal(title);

      await todoList.toggle_todo_status(0);
      expect((await todoList.get_todos())[0][2]).to.be.true;
    });

    it("should delete a user todo", async () => {
      const title2 = "Food";
      const desc2 = "Eat this particular meal";

      await todoList.create_todo(title2, desc2);
      await todoList.delete_todo(0);

      const todoToCheck = await todoList.get_single_todo(0);

      expect(todoToCheck[0]).to.equal("");
      expect(todoToCheck[1]).to.equal("");
      expect(todoToCheck[2]).to.be.false;
    });

    it("update todo", async () => {
      const title2 = "Food";
      const desc2 = "Eat this particular meal";

      await todoList.create_todo(title2, desc2);
      expect(
        todoList.update_todo(1, "Drink", "Take fruit juice")
      ).to.be.revertedWith("Invalid index");

      await todoList.update_todo(0, "Drink", "Take fruit juice");
      expect((await todoList.get_single_todo(0))[0]).to.be.equal("Drink")
    });
  });
});