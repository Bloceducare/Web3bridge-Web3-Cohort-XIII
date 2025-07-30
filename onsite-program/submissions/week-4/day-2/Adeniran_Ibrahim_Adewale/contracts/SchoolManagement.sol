// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SchoolManagement {
    struct Student {
        uint id;
        string fullName;
        uint age;
        Status status;
    }

    enum Status {ACTIVE, DEFERRED, RUSTICATED}

    Student[] studentList;
    uint nextId = 10;

    function createNewStudent(string memory _fullName, uint _age) external {
        Student memory newStudent = Student(nextId, _fullName, _age, Status.ACTIVE);
        studentList.push(newStudent);
        nextId++;
    }

    function updateStudentAge(uint _index, uint _age) external {
        studentList[_index].age = _age;   
    }

    function updateStudentStatus(uint _index, Status _status) external {
        studentList[_index].status = _status;
    }

    function removeStudentData(uint _index) external {
        studentList[_index] = studentList[studentList.length - 1];
        studentList.pop();
    }

    function studentDetails(uint _index) external view returns (uint, string memory, uint, Status) {
        return (studentList[_index].id, studentList[_index].fullName, studentList[_index].age, studentList[_index].status);
    }

    function listEnrolledStudent() external view returns (Student[] memory) {
        return studentList;
    }
}