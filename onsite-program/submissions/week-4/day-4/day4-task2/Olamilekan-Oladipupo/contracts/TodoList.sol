// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;



contract TodoList {
    mapping (address => Todo[]) myTodo;
    uint256 private id;


    struct Todo {
        string name;
        string description;
        bool status;
        address userAddress;
        uint id;        
    }

    error UNAUTHORIZED();
    error TODO_NOT_FOUND();

  

 
    function createTodo (string memory _name, string memory _description) external  {
        Todo memory newTodo;
        newTodo.name = _name;
        newTodo.description = _description;
        newTodo.status = false;
        newTodo.id = id++; 
        newTodo.userAddress = msg.sender;
        myTodo[msg.sender].push(newTodo);
    }


    function setName(uint256 _todoId, string memory _name) external {
        require(myTodo[msg.sender][0].userAddress == msg.sender, UNAUTHORIZED());

        for (uint256 i; i < myTodo[msg.sender].length; i++) {
            if (myTodo[msg.sender][i].id == _todoId){
                myTodo[msg.sender][i].name = _name;
                return;
            }
            
        }

        revert TODO_NOT_FOUND();
    }

    function setDescription(uint256 _todoId, string memory _description) external {
        require(myTodo[msg.sender][0].userAddress == msg.sender, UNAUTHORIZED());
        for (uint256 i; i < myTodo[msg.sender].length; i++) {
            if (myTodo[msg.sender][i].id == _todoId){
                myTodo[msg.sender][i].description = _description;
                return;
            }
        }

        revert TODO_NOT_FOUND();
    }
    

    function toggleTodo (uint _todoId)  external {
        require(myTodo[msg.sender][0].userAddress == msg.sender, UNAUTHORIZED());
        for (uint256 i; i < myTodo[msg.sender].length; i++) {
            if (myTodo[msg.sender][i].id == _todoId){
                myTodo[msg.sender][i].status = !myTodo[msg.sender][i].status;
                return;
            }
            
        }

        revert TODO_NOT_FOUND();


    }

    function getTodoById (uint256 _todoId)  external view  returns (Todo memory) {
        require(myTodo[msg.sender][0].userAddress == msg.sender, UNAUTHORIZED());
        for (uint256 i; i < myTodo[msg.sender].length; i++) {
            if (myTodo[msg.sender][i].id == _todoId){
                return myTodo[msg.sender][i];
            }
        }
        revert TODO_NOT_FOUND();
    }


    function getMyTodo()  external view  returns (Todo [] memory) {
        require(myTodo[msg.sender].length > 0, "no todo created");
        return myTodo[msg.sender];

    }
}
        


    
        