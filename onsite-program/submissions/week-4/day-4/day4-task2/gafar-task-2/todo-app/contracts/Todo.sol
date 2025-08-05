//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TodoList {
   struct Todo{
      string title;
      string description;
      bool status;
   }
   mapping(address userAddress => Todo) todoMap;
    
    Todo[] public todos;

    function create_todo(string memory _title, string memory _description) external {
       todoMap[msg.sender] = Todo({title: _title, status: false, description: _description});
        todos.push(todoMap[msg.sender]);
    }
    function update_todo(string memory _new_title, string memory _new_description) external{
      Todo storage updated_todo = todoMap[msg.sender];
      updated_todo.title = _new_title;
      updated_todo.description = _new_description;
    }

   function toggle_todo_status() external {
      Todo storage todo = todoMap[msg.sender];
      todo.status = !todo.status;
   }

   function get_todos() external view returns (Todo[] memory){
      return todos;
   }
   
   function get_user_todo(address _user) external view returns (Todo memory) {
      return todoMap[_user];
   }

   function delete_todo() external {
      delete todoMap[msg.sender];       
   }

}
