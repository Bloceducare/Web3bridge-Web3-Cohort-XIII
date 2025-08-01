//SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract TodoList {
    struct Todo {
        string title;
        string description;
        bool status;
        uint time;
    }

    mapping(address => Todo[]) private userTodos;

    modifier validIndex(uint _index) {
        require(_index < userTodos[msg.sender].length, "Invalid index");
        _;
    }

    function createTodo(string memory _title, string memory _description) external {
        userTodos[msg.sender].push(Todo(_title, _description, false, block.timestamp));
    }

    function updateTodo(uint _index, string memory newTitle, string memory newDesc) external validIndex(_index) {
        Todo storage t = userTodos[msg.sender][_index];
        t.title = newTitle;
        t.description = newDesc;
    }

    function deleteTodo(uint _index) external validIndex(_index) {
        delete userTodos[msg.sender][_index];
    }

    function toggleTodo(uint _index) external validIndex(_index) {
        userTodos[msg.sender][_index].status = !userTodos[msg.sender][_index].status;
    }

    function getSpecificTodo(uint _index) external view validIndex(_index) returns (Todo memory) {
        return userTodos[msg.sender][_index];
    }

    function checkComplete() external view returns (uint count) {
        for (uint i = 0; i < userTodos[msg.sender].length; i++) {
            if (userTodos[msg.sender][i].status) {
                count++;
            }
        }
    }

    function checkIncomplete() external view returns (uint count) {
        for (uint i = 0; i < userTodos[msg.sender].length; i++) {
            if (!userTodos[msg.sender][i].status) {
                count++;
            }
        }
    }

    function getTodos() external view returns (Todo[] memory) {
        return userTodos[msg.sender];
    }
}

