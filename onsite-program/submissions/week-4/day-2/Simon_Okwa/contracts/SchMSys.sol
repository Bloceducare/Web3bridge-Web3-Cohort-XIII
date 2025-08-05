
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract SchoolManagementSystem {

     enum Status { ACTIVE, DEFERRED, RUSTICATED }

    struct Student {
        string name;
        uint age;
        Status status;
        bool exists; // to track deleted or uninitialized entries
    }

    Student[] public students;

    // Register new student (ID = index in array)
    function registerStudent(string memory _name, uint _age) external {
        students.push(Student(_name, _age, Status.ACTIVE, true));
    }

    // Update student by index (used as ID)
    function updateStudent(uint256 _id, string memory _name, uint256 _age) public {
        require(_id < students.length, "Invalid ID");
        require(students[_id].exists, "Student does not exist");

        students[_id].name = _name;
        students[_id].age = _age;
    }

    // Delete student by index
    function deleteStudent(uint256 _id) public {
        require(_id < students.length, "Invalid ID");
        require(students[_id].exists, "Student already deleted");

        // Just mark as deleted
        students[_id].exists = false;
    }

    // Change student status
    function changeStatus(uint256 _id, Status _status) public {
        require(_id < students.length, "Invalid ID");
        require(students[_id].exists, "Student does not exist");

        students[_id].status = _status;
    }

    // Get single student
    function getStudent(uint256 _id) public view returns (Student memory) {
        require(_id < students.length, "Invalid ID");
        require(students[_id].exists, "Student does not exist");

        return students[_id];
    }

    function getAllStudents() public view returns (Student[] memory) {
        return students;
    }

    // Get total count (including deleted entries)
    function getTotalStudents() public view returns (uint256) {
        return students.length;
    }
}

    

