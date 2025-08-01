// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract ToDoList {
   struct Todo{
    string title;
    string description;
    bool status;
   }

   mapping(address => Todo[]) public todos;

   function create_todo(string memory _title, string memory _description) external {
    Todo memory new_todo_ = Todo(_title, _description, false);
    todos[msg.sender].push(new_todo_);
   }

   function update_todo(uint256 _index, string memory _new_title, string memory _new_description) external{
    require (_index < todos[msg.sender].length, "Invalid Index");
    todos[msg.sender][_index].title = _new_title;
    todos[msg.sender][_index].description = _new_description;
   }

   function toggle_todo_status(uint256 _index) external{
      require (_index < todos[msg.sender].length, "Invalid Index");
      todos[msg.sender][_index].status = !todos[msg.sender][_index].status;
   }

   function get_todos() external view returns (Todo[] memory){
      return todos[msg.sender];
   }

   function delete_todo(uint _index)external{
    require (_index < todos[msg.sender].length, "Invalid Index");
    delete todos[msg.sender][_index];
   }
}
