// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./interface.sol";



contract StudentSchool is Ipractise {
    receive() external payable {}
    address payable owner;
    mapping(address => Storage.Student) private studentData;
    mapping(address => uint256) public balanceOf;
    constructor  ( address _owner) payable {
        require(_owner != address(0), "Invalid owner");
        owner =payable (_owner);
    }
    
    Storage.Student[] private studentList;
    uint private nextId;

    function register(string memory _name, uint256 _age) external {
       
     Storage.Student memory newStudent;
     newStudent.name = _name;
     newStudent.age = _age;
     newStudent.owner= msg.sender;
     newStudent.UID = nextId;
     nextId++;
     studentData[msg.sender]= newStudent;
     
     studentList.push(newStudent);
    }
    function update(string memory _name, uint _age, uint _UID) external{
        require(studentData[msg.sender].owner == msg.sender, Storage.NOT_VALID());
        studentData[msg.sender].name=_name;
        studentData[msg.sender].age=_age;
        for (uint i; i< studentList.length; i++) 
        {
            if (studentList[i].UID==_UID) {
                studentList[i].name=_name;
                studentList[i].age=_age;
            }
        }
    }

    
    function get_by_address(address _address) external view returns(Storage.Student memory){
        return studentData[_address];
    }

    function get_all() external view returns(Storage.Student[] memory) {
        return studentList;
    }
    
    

    function pay_salary(address _address, uint _amount) external payable {
    require(msg.sender == owner, Storage.NOT_VALID()); // Only owner can pay
    require(_amount > 0, Storage.NOT_VALID());
    require(address(this).balance >= _amount, "Insufficient funds");

    payable(_address).transfer(_amount);
}

function mint() external payable{
    require(msg.value > 0, "Must send Ether");
}

// function mint(address _to, uint256 _amount) external {
//         require(_to != address(0), "Invalid address");
//         require(_amount > 0, "Amount must be > 0");
//         balanceOf[_to] += _amount;
//     }

}
