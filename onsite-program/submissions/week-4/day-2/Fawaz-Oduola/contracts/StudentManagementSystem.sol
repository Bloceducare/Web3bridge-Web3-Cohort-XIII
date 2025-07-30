// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// 0x536b7929DFE51D4aae537B97A9ED61f0E5F9D65b
// explorer: https://sepolia-blockscout.lisk.com/address/0x536b7929DFE51D4aae537B97A9ED61f0E5F9D65b#code

contract StudentManagementSystem {

    address public owner;
    constructor(){
        owner = msg.sender;
    }

    struct Student {
        uint256 id;
        string name;
        uint256 age;
        string course;
        Status status;
    }

    enum Status {ACTIVE, DEFERRED, RUSTICATED}

    Student[] public students;

    function registerStudent( string memory _name, uint256 _age, string memory _course) external  {
        // require(msg.sender==owner, "unauthorised access");
        uint256 id = students.length;
        Student memory student = Student(id, _name, _age, _course, Status.ACTIVE);
        students.push(student);
    }

    function updateStudent(uint256 id, string memory _name, uint256 _age, string memory _course, Status _status) external  {
        // require(msg.sender==owner, "unauthorised access");
        require(id<students.length, "invalid id");
        students[id].name = _name;
        students[id].age = _age;
        students[id].course = _course;
        students[id].status = _status;
    }

    function deleteStudent(uint256 id) external  {
        require(id<students.length, "invalid id");
        // require(msg.sender==owner, "unauthorised access");
        delete students[id];
    }

    function getAllStudents() external view returns (Student[] memory) {
        return students;
    }

    function getStudent(uint256 _id) external view returns (Student memory) {
        return students[_id];
    }

    
}