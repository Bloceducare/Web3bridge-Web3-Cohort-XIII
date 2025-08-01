// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract TodoList {
    struct Todo {
        string title;
        string description;
        bool status;
        uint id;
    }

    mapping(address => Todo[]) public userTodos;

    function create_todo(string memory _title, string memory _description) external {
        uint nextTodoId = userTodos[msg.sender].length-1;
        userTodos[msg.sender].push(Todo({
            title: _title,
            description: _description,
            status: false,
            id: nextTodoId
        }));

    }

    function update_todo(uint _index, string memory _new_title, string memory _new_description) external {
        require(_index < userTodos[msg.sender].length, "Invalid index");
        Todo storage todo = userTodos[msg.sender][_index];
        todo.title = _new_title;
        todo.description = _new_description;
    }

    function toggle_todo_status(uint _index) external {
        require(_index < userTodos[msg.sender].length, "Invalid index");
        userTodos[msg.sender][_index].status = !userTodos[msg.sender][_index].status;
    }

    function get_todos() external view returns (Todo[] memory) {
        return userTodos[msg.sender];
    }

    function delete_todo(uint _index) external {
        uint len = userTodos[msg.sender].length;
        require(_index < len, "Invalid index");

        if (_index != len - 1) {
            userTodos[msg.sender][_index] = userTodos[msg.sender][len - 1];
        }
        userTodos[msg.sender].pop();
    }
}
