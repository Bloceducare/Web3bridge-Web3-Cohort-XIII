// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Child.sol";

contract TodoList {
    Child[] public todoLists;

    function createTodoList() external {
        Child newTodoList = new Child();
        todoLists.push(newTodoList);
    }
}