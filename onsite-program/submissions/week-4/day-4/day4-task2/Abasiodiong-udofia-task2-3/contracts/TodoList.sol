// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TodoList {
    
    struct Todo {
        uint256 id;
        string title;
        string description;
        bool status;
        bool exists;
    }

    
    struct UserTodos {
        mapping(uint256 => Todo) todos;
        uint256 nextId;
        uint256 todoCount;
    }

    mapping(address => UserTodos) private userTodos;

    event TodoCreated(address indexed user, uint256 id, string title, string description, bool status);
    event TodoUpdated(address indexed user, uint256 id, string title, string description);
    event TodoStatusToggled(address indexed user, uint256 id, bool status);
    event TodoDeleted(address indexed user, uint256 id);

    function create_todo(string memory _title, string memory _description) external {
        require(bytes(_title).length > 0, "Title cannot be empty");
        UserTodos storage todos = userTodos[msg.sender];
        uint256 todoId = todos.nextId;
        todos.todos[todoId] = Todo(todoId, _title, _description, false, true);
        todos.todoCount++;
        todos.nextId++;
        emit TodoCreated(msg.sender, todoId, _title, _description, false);
    }

    function update_todo(uint256 _id, string memory _new_title, string memory _new_description) external {
        require(userTodos[msg.sender].todos[_id].exists, "Todo does not exist");
        require(bytes(_new_title).length > 0, "Title cannot be empty");
        Todo storage todo = userTodos[msg.sender].todos[_id];
        todo.title = _new_title;
        todo.description = _new_description;
        emit TodoUpdated(msg.sender, _id, _new_title, _new_description);
    }

    function toggle_todo_status(uint256 _id) external {
        require(userTodos[msg.sender].todos[_id].exists, "Todo does not exist");
        Todo storage todo = userTodos[msg.sender].todos[_id];
        todo.status = !todo.status;
        emit TodoStatusToggled(msg.sender, _id, todo.status);
    }

    function delete_todo(uint256 _id) external {
        require(userTodos[msg.sender].todos[_id].exists, "Todo does not exist");
        userTodos[msg.sender].todos[_id].exists = false;
        userTodos[msg.sender].todoCount--;
        emit TodoDeleted(msg.sender, _id);
    }

    function get_todo(uint256 _id) external view returns (uint256, string memory, string memory, bool, bool) {
        require(userTodos[msg.sender].todos[_id].exists, "Todo does not exist");
        Todo memory todo = userTodos[msg.sender].todos[_id];
        return (todo.id, todo.title, todo.description, todo.status, todo.exists);
    }

    function get_todos() external view returns (uint256[] memory) {
        UserTodos storage todos = userTodos[msg.sender];
        uint256[] memory todoIds = new uint256[](todos.todoCount);
        uint256 index = 0;
        for (uint256 i = 0; i < todos.nextId; i++) {
            if (todos.todos[i].exists) {
                todoIds[index] = i;
                index++;
            }
        }
        return todoIds;
    }

    function get_todo_count() external view returns (uint256) {
        return userTodos[msg.sender].todoCount;
    }
}