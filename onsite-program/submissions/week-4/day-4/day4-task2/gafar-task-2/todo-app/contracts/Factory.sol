// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./Todo.sol";

contract FactoryTodo {
  TodoList[] public todoArray;

  function createTodo(uint256 todoIndex, string memory _title, string memory _description) external {
    return TodoList(address(todoArray[todoIndex])).create_todo(_title, _description);
  }

  function updateTodo(uint256 todoIndex, string memory _title, string memory _description) external {
    return TodoList(address(todoArray[todoIndex])).update_todo(_title, _description);
  }

  function updateTodoStatus(uint256 todoIndex) external {
    return TodoList(address(todoArray[todoIndex])).toggle_todo_status();
  }

  function getAllTodos(uint256 todoIndex) external view returns(Todo[] memory) {
    return TodoList(address(todoArray[todoIndex])).get_todos();
  }

  function getTodos(uint256 todoIndex, address _user_address) external view returns(Todo memory) {
    return TodoList(address(todoArray[todoIndex])).get_user_todo(_user_address);
  }

  function getTodos(uint256 todoIndex) external {
    return TodoList(address(todoArray[todoIndex])).delete_todo();
  }
}
