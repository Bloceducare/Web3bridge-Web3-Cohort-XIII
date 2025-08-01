//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TodoList {
    struct Todo {
        string title;
        string description;
        bool status;
    }

    mapping(address => Todo[]) todoLibrary;

    function create_todo(
        string memory _title,
        string memory _description
    ) external {
        Todo memory new_todo_ = Todo({
            title: _title,
            status: false,
            description: _description
        });

        todoLibrary[msg.sender].push(new_todo_);
    }

    function update_todo(
        uint256 _index,
        string memory _new_title,
        string memory _new_description
    ) external {
        require(_index < todoLibrary[msg.sender].length, "Invalid index");
        todoLibrary[msg.sender][_index].title = _new_title;
        todoLibrary[msg.sender][_index].description = _new_description;
    }

    function toggle_todo_status(uint256 _index) external {
        require(_index < todoLibrary[msg.sender].length, "Invalid index");
        todoLibrary[msg.sender][_index].status = !todoLibrary[msg.sender][_index].status;
    }

    function get_todos() external view returns (Todo[] memory) {
        return todoLibrary[msg.sender];
    }

    function get_single_todo(uint _index) external view returns (Todo memory) {
        require(_index < todoLibrary[msg.sender].length, "Invalid index");
        return todoLibrary[msg.sender][_index];
    }

    function delete_todo(uint256 _index) external {
        require(_index < todoLibrary[msg.sender].length, "Invalid index");
        delete todoLibrary[msg.sender][_index];
    }
}
