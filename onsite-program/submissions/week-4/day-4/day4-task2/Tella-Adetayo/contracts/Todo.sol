// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TodoList {

    address internal owner = msg.sender;  

    struct Todo {
        uint256 id; 
        string title;  
        string description; 
        bool status; 
    }

    //Todo[] internal todos; 

    mapping(address => Todo[]) internal todosByOwner;

    uint256 internal uid; 

    error INDEX_OUT_OF_BOUND(); 

    function create_todo(string memory _title, string memory _description) external  { 
        uid = uid + 1; 
        Todo memory todo = Todo({id: uid, title: _title, description: _description, status: false});
        // todos.push(todo); 
        todosByOwner[msg.sender].push(todo);   
    } 

    function toogleTodo(uint256 _index) external {
        Todo[] storage userTodos = todosByOwner[msg.sender];
        if (_index >= userTodos.length) {
            revert INDEX_OUT_OF_BOUND();
        } 
        userTodos[_index].status = !userTodos[_index].status; 

    }

    function update_todo(uint256 _index, string memory _title, string memory _description) external  {
        Todo[] storage userTodos = todosByOwner[msg.sender];

        if (_index >= userTodos.length) {
            revert INDEX_OUT_OF_BOUND();
        }
        userTodos[_index].title = _title;
        userTodos[_index].description = _description; 
    } 

    function deleteTodo(uint256 _index) external {
        Todo[] storage userTodos = todosByOwner[msg.sender]; 

        if (_index >= userTodos.length) {
            revert INDEX_OUT_OF_BOUND();
        }

        userTodos[_index] = userTodos[userTodos.length - 1]; 
        userTodos.pop(); 
    }

    function getTodos() external view returns (Todo[] memory) {
        return todosByOwner[msg.sender];
        // return todos; 
    }

    function getTodo(uint256 _index) external view returns (string memory, string memory, bool) {
        Todo storage userTodo = todosByOwner[msg.sender][_index]; 
        return (userTodo.title, userTodo.description, userTodo.status); 

    }

}