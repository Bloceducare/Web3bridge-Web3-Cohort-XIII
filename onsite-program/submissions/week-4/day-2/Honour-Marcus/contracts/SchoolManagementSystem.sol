// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract SchoolManagementSystem {

    
    enum Status { ACTIVE, DEFERRED, RUSTICATED }

    
    struct Student {
        uint id;
        string name;
        uint age;
        Status status;
    }

    Student[] public students;
    uint public nextId = 0;

    
    function registerStudent(string memory _name, uint _age) external {
        students.push(Student(nextId, _name, _age, Status.ACTIVE));
        nextId++;
    }

    
    function updateStudent(uint _id, string memory _newName, uint _newAge) external {
        require(_id < students.length, "Invalid student id");
        students[_id].name = _newName;
        students[_id].age = _newAge;
    }

    
    function updateStatus(uint _id, Status _newStatus) external {
        require(_id < students.length, "Invalid student id");
        students[_id].status = _newStatus;
    }

   
    function getAllStudents() external view returns (Student[] memory) {
        return students;
    }

  
    function getStudent(uint _id) external view returns (Student memory) {
        require(_id < students.length, "Invalid student id");
        return students[_id];
    }

   
    function deleteStudent(uint _id) external {
        require(_id < students.length, "Invalid student id");
        delete students[_id];
    }
}
