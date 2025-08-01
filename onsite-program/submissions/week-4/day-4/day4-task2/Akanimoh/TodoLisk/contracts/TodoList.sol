// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TodoList {
    enum Status { PENDING, COMPLETED, CANCELLED }

    struct Todo {
        string title;
        string description;
        Status status;
    }

    mapping(address => Todo[]) public todos;

    function set_todo(string memory _title, string memory _description) external {
        Todo memory new_todo = Todo({
            title: _title,
            description: _description,
            status: Status.PENDING
        });
        todos[msg.sender].push(new_todo);
    }

    function update_todo(uint256 _index, string memory _new_title, string memory _new_description) external {
        require(_index < todos[msg.sender].length, "Invalid index");
        todos[msg.sender][_index].title = _new_title;
        todos[msg.sender][_index].description = _new_description;
    }

    function update_status(uint256 _index, Status _new_status) external {
        require(_index < todos[msg.sender].length, "Invalid index");
        todos[msg.sender][_index].status = _new_status;
    }

    function delete_todo(uint256 _index) external {
        require(_index < todos[msg.sender].length, "Invalid index");
        todos[msg.sender][_index] = todos[msg.sender][todos[msg.sender].length - 1];
        todos[msg.sender].pop();
    }

    function get_todo(uint256 _index) external view returns (Todo memory) {
        require(_index < todos[msg.sender].length, "Invalid index");
        return todos[msg.sender][_index];
    }

    function get_todos() external view returns (Todo[] memory) {
        return todos[msg.sender];
    }

    function get_todo_count() external view returns (uint256) {
        return todos[msg.sender].length;
    }
}