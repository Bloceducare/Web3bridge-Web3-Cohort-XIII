//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TodoList {
    struct Todo{
        string title;
        string description;
        bool status;
        address owner;
    }

    
    Todo[] private todos;
    mapping (address => Todo[]) private todo;

    function create_todo(string memory _title, string memory _description) external {
        
        Todo memory new_todo_ = Todo({title: _title, status: false, description: _description, owner: msg.sender});
        todos.push(new_todo_);
        todo[msg.sender].push(new_todo_);

        // todos.push(Todos(title, description, false));
    }
    function update_todo_by_address(address owner,uint256 index, string memory _new_title, string memory _new_description) external{
      
      require(owner==msg.sender, "You are not the owner");
      require (index < todo[owner].length, "invalid index");
            todo[owner][index].title = _new_title;
            todo[owner][index].description = _new_description;
       
    }

    function update_todo(uint256 _index, string memory _new_title, string memory _new_description) external{
        require(_index <= todos.length, "Invalid index");
        todos[_index].title = _new_title;
        todos[_index].description = _new_description;
    }

    function toggle_todo_status(uint256 _index) external {
      
      todos[_index].status = !todos[_index].status;
    }

    function get_todos() external view returns (Todo[] memory){
        return todos;
    }
    function get_todos_by_address() external view returns (Todo[] memory){
        
            return todo[msg.sender];
    }

//     function delete_todo(uint256 _index) external {
//         require(_index <= todos.length, "Invalid index");
//         delete todos[_index];       
// }
function delete_todo( uint index) external  {
    require(index < todo[msg.sender].length, "invalid index");
    require(msg.sender == todo[msg.sender][index].owner);
    
    todo[msg.sender][index] = todo[msg.sender][todo[msg.sender].length-1];
    todo[msg.sender].pop();

 }

}