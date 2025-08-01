// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract TodoList {
    
    struct Todo {
        string title;
        string description;
        bool status;
    }
    
    mapping(address => Todo[]) private userTodos;
    

   
    function create_todo(string memory _title, string memory _description) external {
        Todo memory newTodo = Todo({
            title: _title,
            description: _description,
            status: false
        });
        
        userTodos[msg.sender].push(newTodo);
    }
    

    function update_todo(uint256 _index, string memory _newTitle, string memory _newDescription) external {
        require(_index < userTodos[msg.sender].length, "Invalid index");
        
        userTodos[msg.sender][_index].title = _newTitle;
        userTodos[msg.sender][_index].description = _newDescription;
    }
    
 
    function toggle_todo_status(uint256 _index) external {
        require(_index < userTodos[msg.sender].length, "Invalid index");
        
        userTodos[msg.sender][_index].status = !userTodos[msg.sender][_index].status;
    }
    
 
    function get_todos() external view returns (Todo[] memory) {
        return userTodos[msg.sender];
    }

    function get_todos_count() external view returns (uint256) {
        return userTodos[msg.sender].length;
    }

    function get_todo(uint256 _index) external view returns (Todo memory) {
        require(_index < userTodos[msg.sender].length, "Invalid index");
        return userTodos[msg.sender][_index];
    }
    
    function delete_todo(uint256 _index) external {
        require(_index < userTodos[msg.sender].length, "Invalid index");
        
        uint256 lastIndex = userTodos[msg.sender].length - 1;
        if (_index != lastIndex) {
            userTodos[msg.sender][_index] = userTodos[msg.sender][lastIndex];
        }
        
        userTodos[msg.sender].pop();
    }
}
