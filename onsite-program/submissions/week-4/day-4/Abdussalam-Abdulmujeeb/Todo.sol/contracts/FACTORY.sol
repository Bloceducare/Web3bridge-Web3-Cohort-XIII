// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./TodoList.sol";

contract Factory {
    TodoList[] public listOfTodoContracts;

    function CreateNewTodoList() public {
        TodoList newTodoList = new TodoList();
        listOfTodoContracts.push(newTodoList);
    }

    function getAllTodoLists() public view returns (TodoList[] memory) {
        return listOfTodoContracts;
    }

    function getTodoListCount() public view returns (uint) {
        return listOfTodoContracts.length;
    }
}
