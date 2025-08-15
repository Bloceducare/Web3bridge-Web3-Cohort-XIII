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

    function update_todo(uint256 _index, string memory _newTittle, string memory _newDescription, address _newTodoAddress) external {
        require(_index <= Todos.length, "Invalid index");
        TodoAddress[_newTodoAddress].tittle = _newTittle;
        TodoAddress[_newTodoAddress].description = _newDescription;
        TodoAddress[_newTodoAddress].status = false;

        Todo memory newTodo_ = Todo(_newTittle, _newDescription, false, level.easy, _newTodoAddress);

        Todos.push(newTodo_);
    }

    function change_task_status(address _todoAddress) external {
        string memory new_tittle = TodoAddress[_todoAddress].tittle;
        string memory new_description = TodoAddress[_todoAddress].description;
        bool new_status = !TodoAddress[_todoAddress].status;



        Todo memory new_data = Todo({ tittle: new_tittle, description: new_description, status: new_status, real_level: level.easy, todoAddress: _todoAddress});

        TodoAddress[_todoAddress] = new_data;


    }

    function show_todo() external view returns (Todo[] memory) {
        return Todos;
    }

    function remove_todo(address _todoAddress, uint _index) external {
        require(_index <= Todos.length, "Invalid Index");
        delete TodoAddress[_todoAddress];
    }

}