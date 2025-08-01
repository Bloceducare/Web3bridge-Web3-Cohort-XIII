//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TodoList {
    struct Todo{
        string title;
        string description;
        bool status;
    }

    
    Todo[] public todos;

    mapping (address=>Todo[]) addressToToDos;

    function create_todo(address _addr, string memory _title, string memory _description) external {
                addressToToDos[_addr].push(Todo({title: _title, status: false, description: _description}));

        // todos.push(Todos(title, description, false));
    }
    function update_todo(address _addr, uint256 _index, string memory _new_title, string memory _new_description) external {

        require(_index <= addressToToDos[_addr].length, "Invalid index");
        
        addressToToDos[_addr][_index].title = _new_title;
        addressToToDos[_addr][_index].description = _new_description;        
    }

    function toggle_todo_status(address _addr, uint256 _index) external {
        require(_index <= addressToToDos[_addr].length, "Invalid index");
      addressToToDos[_addr][_index].status = !addressToToDos[_addr][_index].status;
    }

    function get_todos(address _addr) external view returns (Todo[] memory){
        return addressToToDos[_addr];
    }

    function delete_todo(address _addr, uint _index) external {
        require(_index <= addressToToDos[_addr].length, "Invalid index");
        addressToToDos[_addr][_index] = addressToToDos[_addr][addressToToDos[_addr].length - 1];    
        addressToToDos[_addr].pop();
        }

}