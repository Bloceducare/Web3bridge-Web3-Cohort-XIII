// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract TodoList {
    error INVALID_INDEX();
    error NOT_AUTHORIZED();
    error TODO_NOT_FOUND();

    struct Todo {
        string title;
        string description;
        bool status;
        address owner;
    }

    Todo[] public todos;

    mapping(address => Todo[]) public todosByAddress;

    modifier onlyOwner(address _userAddress) {
        if (msg.sender != _userAddress) {
            revert NOT_AUTHORIZED();
        }
        _;
    }

//    function create_todo(string memory _title, string memory _description) external {
//        Todo memory new_todo_ = Todo({title: _title, description: _description, status: false});
//        todos.push(new_todo_);
//    }

    function create_todo_for_sender(string memory _title, string memory _description) external {
        Todo memory new_todo = Todo({title: _title, description: _description, status: false, owner: msg.sender});

        todosByAddress[msg.sender].push(new_todo);
        todos.push(new_todo);
    }

    function update_todo(uint256 _index, string memory _new_title, string memory _new_description) external {
        require(_index <= todos.length-1, "Invalid index");
        todos[_index].title = _new_title;
        todos[_index].description = _new_description;
    }

    function toggle_todo_status(uint256 _index) external {
        todos[_index].status = !todos[_index].status;
    }

    function get_todos() external view returns(Todo[] memory) {
        return todos;
    }

    function delete_todo(uint256 _index) external {
        require(_index <= todos.length-1, "Invalid index");
        delete todos[_index];
    }


    function get_todos_by_address(address _userAddress) external view returns (Todo[] memory) {
        return todosByAddress[_userAddress];
    }


}
