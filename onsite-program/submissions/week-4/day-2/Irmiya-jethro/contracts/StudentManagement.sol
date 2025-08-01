// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SchoolManagement {
    enum Status { ACTIVE, DEFERRED, RUSTICATED }

    struct Student {
        uint256 id;
        string name;
        uint256 age;
        Status status;
    }

    Student[] public students;
    uint256 private nextId = 1;

    function registerStudent(string memory _name, uint256 _age) external {
        students.push(Student(nextId, _name, _age, Status.ACTIVE));
        nextId++;
    }

    function updateStudent(uint256 _id, string memory _newName, uint256 _newAge) external {
        require(_id > 0 && _id <= students.length, "Invalid student ID");
        students[_id - 1].name = _newName;
        students[_id - 1].age = _newAge;
    }

    function updateStudentStatus(uint256 _id, Status _newStatus) external {
        require(_id > 0 && _id <= students.length, "Invalid student ID");
        students[_id - 1].status = _newStatus;
    }

    function deleteStudent(uint256 _id) external {
        require(_id > 0 && _id <= students.length, "Invalid student ID");
        delete students[_id - 1];
    }

    function getStudent(uint256 _id) external view returns (Student memory) {
        require(_id > 0 && _id <= students.length, "Invalid student ID");
        return students[_id - 1];
    }

    function getAllStudents() external view returns (Student[] memory) {
        return students;
    }
}