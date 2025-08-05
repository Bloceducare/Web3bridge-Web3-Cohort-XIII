// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./interface.sol";



contract StudentSchool is Ipractise {
    receive() external payable {}
    address payable owner;
    mapping(address => Storage.Student) private studentData;
    constructor  () payable {
        owner =payable (msg.sender);
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
        require(studentData[_address].owner ==msg.sender, Storage.NOT_VALID());
        require(_amount>0, Storage.NOT_VALID());

        payable (_address).transfer(_amount);
    }
    
}
