// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SchoolManagement {
    
    enum Status { ACTIVE, DEFERRED, RUSTICATED }

    struct Student {
        uint256 id;
        string name;
        uint256 age;
        Status status;
        bool exists;
    }

    Student[] public students;
    uint256 public nextId;

    event StudentRegistered(uint256 id, string name, uint256 age, Status status);
    event StudentUpdated(uint256 id, string name, uint256 age, Status status);
    event StudentDeleted(uint256 id);

    function registerStudent(string memory _name, uint256 _age) public {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_age > 0, "Age must be greater than 0");

        students.push(Student(nextId, _name, _age, Status.ACTIVE, true));
        emit StudentRegistered(nextId, _name, _age, Status.ACTIVE);
        nextId++;
    }

    function updateStudent(uint256 _id, string memory _name, uint256 _age, Status _status) public {
        require(_id < students.length, "Invalid student ID");
        require(students[_id].exists, "Student does not exist");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_age > 0, "Age must be greater than 0");

        students[_id].name = _name;
        students[_id].age = _age;
        students[_id].status = _status;
        emit StudentUpdated(_id, _name, _age, _status);
    }

    function deleteStudent(uint256 _id) public {
        require(_id < students.length, "Invalid student ID");
        require(students[_id].exists, "Student does not exist");

        students[_id].exists = false;
        emit StudentDeleted(_id);
    }

    function getStudent(uint256 _id) public view returns (uint256, string memory, uint256, Status, bool) {
        require(_id < students.length, "Invalid student ID");
        require(students[_id].exists, "Student does not exist");

        Student memory student = students[_id];
        return (student.id, student.name, student.age, student.status, student.exists);
    }

    function getAllStudents() public view returns (Student[] memory) {
        return students;
    }
}