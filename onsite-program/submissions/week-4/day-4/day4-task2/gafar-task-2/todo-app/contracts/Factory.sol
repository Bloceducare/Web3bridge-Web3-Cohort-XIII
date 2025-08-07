// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./Todo.sol";

contract FactoryTodo {
  TodoList[] public todoArray;

  function createNewTodo() external {
    TodoList todo = new TodoList();
    todoArray.push(todo);
  }
}
