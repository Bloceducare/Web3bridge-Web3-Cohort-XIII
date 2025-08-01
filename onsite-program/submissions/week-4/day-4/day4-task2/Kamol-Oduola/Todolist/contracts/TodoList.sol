// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TodoList {
    struct Todo {
        string title;
        string description;
        bool status;
    }

    
    mapping(address => Todo[]) private Todos;

    
    function createTodo(string memory _title, string memory _description) external {
        Todos[msg.sender].push(Todo({
            title: _title,
            description: _description,
            status: false
        }));
    }


    function updateTodo(uint256 _index, string memory _newTitle, string memory _newDescription) external {
        require(_index < Todos[msg.sender].length, "Invalid index");
        Todo storage todo = Todos[msg.sender][_index];
        todo.title = _newTitle;
        todo.description = _newDescription;
    }

    function toggleTodoStatus(uint256 _index) external {
        require(_index < Todos[msg.sender].length, "Invalid index");
        Todos[msg.sender][_index].status = !Todos[msg.sender][_index].status;
    }

    
    function getTodos() external view returns (Todo[] memory) {
        return Todos[msg.sender];
    }

    
    function deleteTodo(uint256 _index) external {
        require(_index < Todos[msg.sender].length, "Invalid index");
        uint256 lastIndex = Todos[msg.sender].length - 1;

        if (_index != lastIndex) {
            Todos[msg.sender][_index] = Todos[msg.sender][lastIndex];
        }

    Todos[msg.sender].pop();
    }
}
