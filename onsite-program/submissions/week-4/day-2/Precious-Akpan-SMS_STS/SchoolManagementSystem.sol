// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SchoolManagementSystem {
    enum Status {ACTIVE, DEFERRED, RUSTICATED}
    enum Sex {MALE, FEMALE}


    struct Student {
        uint id;
        string name;
        uint age;
        Sex sex;
        Status status;
    }

    Student[] public students;
    uint private nextId = 0;

    // Register a new student
    function registerStudent(string memory name, uint age, Sex sex) public {
        students.push(Student({
            id: nextId,
            name: name,
            age: age,
            sex: sex,
            status: Status.ACTIVE
        }));
        nextId++;
    }

    // Update student details by ID
    function updateStudent(uint index, string memory name, uint age) public {
        require(index < students.length, "Student not found");
        students[index].name = name;
        students[index].age = age;
    }

    // Delete student by ID
    function deleteStudent(uint index) public {
        require(index < students.length, "Student not found");
        students[index] = students[students.length - 1];
        students.pop();
    }

    // Change student status by ID
    function changeStatus(uint index, Status newStatus) public {
        require(index < students.length, "Student not found");
        students[index].status = newStatus;
    }

// Get a single student by ID
    function getStudent(uint index) public view returns (Student memory) {
        require(index < students.length, "Student not found");
        return students[index];
    }

// Get all students
    function getAllStudents() public view returns (Student[] memory) {
        return students;
    }
    // Add more functions as needed
}
