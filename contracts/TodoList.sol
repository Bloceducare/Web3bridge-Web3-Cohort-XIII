// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.20;

contract TodoList {

    struct Todo {
        string tittle;
        string description;
        bool status;
        level real_level;
        address todoAddress;
    }

    enum level {
        easy,
        medium,
        hard
    }

    Todo[] public Todos;

    mapping (address => Todo) TodoAddress;

    function create_todo(string memory _tittle, string memory _description, address _todoAddress) external {

        Todo memory newTodo_ = Todo({ tittle: _tittle, description: _description, status: false, real_level: level.easy, todoAddress: _todoAddress});

        Todos.push(newTodo_);

        TodoAddress[_todoAddress] = newTodo_;

    }

    function update_todo(uint256 _index, string memory _newTittle, string memory _newDescription, address _todoAddress) external {
        require(_index <= Todos.length, "Invalid index");
        TodoAddress[_todoAddress].tittle = _newTittle;
        TodoAddress[_todoAddress].description = _newDescription;
        TodoAddress[_todoAddress].status = false;
    }

    function change_task_status(address _todoAddress) external {
        TodoAddress[_todoAddress].status = !TodoAddress[_todoAddress].status;
    }

    function show_todo() external view returns (Todo[] memory) {
        return Todos;
    }

    function remove_todo(address _todoAddress, uint _index) external {
        require(_index <= Todos.length, "Invalid Index");
        delete TodoAddress[_todoAddress];
    }

}