// SPDX-License-Identifier: UNLICENCE
pragma solidity ^0.8.28;

contract TodoList {
    struct Todo {
        string title;
        string description;
        bool status;
    }

    mapping(address => Todo[]) private userTodos;

    function create_todo(string memory _title, string memory _description) external {
        Todo memory newTodo = Todo(_title, _description, false);
        userTodos[msg.sender].push(newTodo);
    }

    function update_todo(uint _index, string memory _new_title, string memory _new_description) external {
        require(_index < userTodos[msg.sender].length, "Invalid index");
        userTodos[msg.sender][_index].title = _new_title;
        userTodos[msg.sender][_index].description = _new_description;
    }

    function toggle_todo_status(uint _index) external {
        require(_index < userTodos[msg.sender].length, "Invalid index");
        userTodos[msg.sender][_index].status = !userTodos[msg.sender][_index].status;
    }

    function get_todos() external view returns (Todo[] memory) {
        return userTodos[msg.sender];
    }

    function delete_todo(uint _index) external {
        require(_index < userTodos[msg.sender].length, "Invalid index");

    
        uint lastIndex = userTodos[msg.sender].length - 1;
        userTodos[msg.sender][_index] = userTodos[msg.sender][lastIndex];
        userTodos[msg.sender].pop();
    }
}



