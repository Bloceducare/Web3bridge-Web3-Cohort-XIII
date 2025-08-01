// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TodoList {
    struct Todo {
        string title;
        string description;
        bool status;
    }

    struct User {
        string school;
        Todo[] todos;
    }

    mapping(address => User) public users;

    function create_todo(string memory _title, string memory _description, string memory _school) external {
        // If school is empty and user doesn't exist, require a school
        if (bytes(users[msg.sender].school).length == 0 && bytes(_school).length == 0) {
            require(bytes(_school).length > 0, "School name is required for new user");
        }
        
        // Set school if provided or if user is new
        if (bytes(_school).length > 0) {
            users[msg.sender].school = _school;
        }

        Todo memory new_todo = Todo({
            title: _title,
            description: _description,
            status: false
        });
        users[msg.sender].todos.push(new_todo);
    }

    function update_todo(uint _index, string memory _new_title, string memory _new_description, string memory _new_school) external {
        require(_index < users[msg.sender].todos.length, "Index is invalid or does not exist");
        
        // Update school if provided
        if (bytes(_new_school).length > 0) {
            users[msg.sender].school = _new_school;
        }

        users[msg.sender].todos[_index].title = _new_title;
        users[msg.sender].todos[_index].description = _new_description;
    }

    function toggle_todo_status(uint _index) external {
        require(_index < users[msg.sender].todos.length, "Index is invalid or does not exist");
        users[msg.sender].todos[_index].status = !users[msg.sender].todos[_index].status;
    }

    function get_todos() external view returns(Todo[] memory, string memory) {
        return (users[msg.sender].todos, users[msg.sender].school);
    }

    function delete_todo(uint _index) external {
        require(_index < users[msg.sender].todos.length, "Index is invalid or does not exist");
        
        // Move the last element to the deleted position
        users[msg.sender].todos[_index] = users[msg.sender].todos[users[msg.sender].todos.length - 1];
        users[msg.sender].todos.pop();
    }
}
