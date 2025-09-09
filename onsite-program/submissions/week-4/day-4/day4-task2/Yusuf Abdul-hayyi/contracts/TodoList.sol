// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

contract TodoList {
    struct Todo {
        string title;
        string description;
        bool status;
    }

    mapping(address => Todo[]) public userTodos;

    function createTodo(string memory _title, string memory _description) external {
        userTodos[msg.sender].push(Todo({
            title: _title,
            description: _description,
            status: false
        }));
    }

    function updateTodo(uint _index, string memory _title, string memory _desc) external {
        require(_index < userTodos[msg.sender].length, "Invalid index");

        Todo storage todo = userTodos[msg.sender][_index];
        todo.title = _title;
        todo.description = _desc;
    }

    function toggleTodo(uint _index) external {
        require(_index < userTodos[msg.sender].length, "Invalid index");
        userTodos[msg.sender][_index].status = !userTodos[msg.sender][_index].status;
    }

    function getMyTodos() external view returns (Todo[] memory) {
        return userTodos[msg.sender];
    }

    function deleteTodo(uint _index) external {
        require(_index < userTodos[msg.sender].length, "Invalid index");

        userTodos[msg.sender][_index] = userTodos[msg.sender][userTodos[msg.sender].length - 1];
        userTodos[msg.sender].pop();
    }
}