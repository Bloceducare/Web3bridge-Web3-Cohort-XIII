// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract Todo{
    struct Data{
        uint256 id;
        string text;
        string description;
        bool status;


    }
    uint256 private uid;

    mapping (address => Data[]) userTodos;

    function create_todo(string memory _text,string memory _description)external {
        uid = uid + 1;
        Data memory todo = Data(uid,_text,_description,true);
        
        userTodos[msg.sender].push(todo);
    }

    function update_todo_title(uint256 _id,string memory _newTitle)external{
        require(userTodos[msg.sender].length > 0,"No todos found");
        for(uint256 i = 0; i<userTodos[msg.sender].length; i++){
            if(userTodos[msg.sender][i].id == _id){
                userTodos[msg.sender][i].text = _newTitle;
            }
        }
    }



  function get_todo(uint256 _id) external view returns(Data memory){
       require(userTodos[msg.sender].length > 0,"No todos found");
       for(uint256 i = 0; i<userTodos[msg.sender].length; i++){
            if(userTodos[msg.sender][i].id == _id){
               return userTodos[msg.sender][i];
    
            }
        }
        revert("Todo not found");
  }

     

 function update_todo_description(uint256 _id,string memory _description)external{
        require(userTodos[msg.sender].length > 0,"No todos found");
        for(uint256 i = 0; i<userTodos[msg.sender].length; i++){
            if(userTodos[msg.sender][i].id == _id){
                userTodos[msg.sender][i].description = _description;
            }
        }
    }



    function todo_todo_status(uint _id,bool _status) external {
        require(userTodos[msg.sender].length > 0,"No todos found");
        for(uint256 i = 0; i<userTodos[msg.sender].length; i++){
            if(userTodos[msg.sender][i].id == _id){
                userTodos[msg.sender][i].status = _status;
            }
        }
    }

    function delete_todo(uint _id) external {
       require(userTodos[msg.sender].length > 0,"No todos found");
       for(uint256 i =0; i < userTodos[msg.sender].length; i++){
        if(userTodos[msg.sender][i].id == _id){
        userTodos[msg.sender][i] = userTodos[msg.sender][userTodos[msg.sender].length - 1];
        userTodos[msg.sender].pop();
        return ;
    }

 }
    revert("Todo not found");

}

    function get_todos() external view returns(Data [] memory){
        return userTodos[msg.sender];
    }

}