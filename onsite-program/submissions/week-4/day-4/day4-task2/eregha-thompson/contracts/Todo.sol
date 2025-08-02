//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TodoList {
    struct Todo {
        uint UID;
        string title;
        string description;
        bool status;
        address owner;
    }

    Todo[] private todos;
    mapping(address => Todo[]) private todo;
    mapping(uint => uint) private IdIndex;
    uint private nextId;

    function create_todo(
        string memory _title,
        string memory _description
    ) external {
        Todo memory new_todo_ = Todo({
            title: _title,
            status: false,
            description: _description,
            owner: msg.sender,
            UID: nextId
        });
        IdIndex[nextId] = todos.length - 1;
        nextId++;
        todos.push(new_todo_);
        todo[msg.sender].push(new_todo_);

        // todos.push(Todos(title, description, false));
    }

    function update_todo(
        uint256 _index,
        string memory _new_title,
        string memory _new_description
    ) external {
        uint newIndex = IdIndex[_index];
        require(todos[newIndex].owner == msg.sender, "invalid owner");
        todos[newIndex].title = _new_title;
        todos[newIndex].description = _new_description;

        Todo[] storage userTodos = todo[msg.sender];
        for (uint256 i = 0; i < userTodos.length; i++) {
            if (userTodos[i].UID == _index) {
                userTodos[i].title = _new_title;
                userTodos[i].description = _new_description;
            }
        }
    }

    function toggle_todo_status(uint256 _index) external {
        todos[_index].status = !todos[_index].status;
    }

    function get_todos() external view returns (Todo[] memory) {
        return todos;
    }
    function get_todos_by_address() external view returns (Todo[] memory) {
        return todo[msg.sender];
    }

    //     function delete_todo(uint256 _index) external {
    //         require(_index <= todos.length, "Invalid index");
    //         delete todos[_index];
    // }
    function delete_todo(uint _index) external {
        require(_index < todos.length, "invalid index");
        require(todos[_index].owner == msg.sender, "invalid owner");

        todos[_index] = todos[todos.length - 1];
        todos.pop();

        Todo[] storage userTodos = todo[msg.sender];
        for (uint256 i = 0; i < userTodos.length; i++) {
            if (userTodos[i].UID == _index) {
                userTodos[i] = userTodos[userTodos.length - 1];
                userTodos.pop();
            }
        }
    }
}
