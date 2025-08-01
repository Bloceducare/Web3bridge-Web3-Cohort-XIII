//SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract TodoList {
    struct Todo{
        string title;
        string description;
        bool status;
    }

    mapping(address => Todo[]) private todos;

    function create_todo(string memory _title, string memory _description) external {
        
        Todo memory new_todo_ = Todo({title: _title, status: false, description: _description});
        todos[msg.sender].push(new_todo_);
    }

    
    function update_todo(uint256 _index, string memory _new_title, string memory _new_description) external{
        require(_index <= todos[msg.sender].length, "Invalid index");
        todos[msg.sender][_index].title = _new_title;
        todos[msg.sender][_index].description = _new_description;
    }

    function toggle_todo_status(uint256 _index) external {
      
      todos[msg.sender][_index].status = !todos[msg.sender][_index].status;
    }

    function get_todos() external view returns (Todo[] memory){
        return todos[msg.sender];
    }

    function delete_todo(uint256 _index) external {
        require(_index <= todos[msg.sender].length, "Invalid index");
        delete todos[msg.sender][_index];       
}

}