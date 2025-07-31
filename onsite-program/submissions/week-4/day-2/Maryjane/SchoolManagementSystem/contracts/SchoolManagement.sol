// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SchoolManagement {
    
    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    struct Students {
        uint id;
        string name;
        uint age;
        Status status;
    }

    Students[] public students;
    uint public studentId = 1;

    function registerStudent(string memory _name, uint _age) public {
        students.push(Students(studentId, _name, _age, Status.ACTIVE));
        studentId++;
    }

    function updateStudent(uint index, string memory _name, uint _age, Status _status) public {
        require(index < students.length, "Invalid index");
        students[index].name = _name;
        students[index].age = _age;
        students[index].status = _status;
    }

   
    function deleteStudent(uint index) public {
        require(index < students.length, "Invalid index");
        students[index] = students[students.length - 1];
        students.pop();
    }

    function getStudentById(uint _index) public view returns (Students memory){
        return students[_index];
    }


    function getAllStudents() public view returns(Students[] memory) {
        return students;
    }
}