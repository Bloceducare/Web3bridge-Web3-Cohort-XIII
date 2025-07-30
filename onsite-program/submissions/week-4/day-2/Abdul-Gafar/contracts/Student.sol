// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

enum StudentStatus {
    ACTIVE,
    DEFERRED,
    RUSTICATED
}

contract StudentRecord {
    struct Student {
        uint id;
        string name;
        uint age;
        StudentStatus status;
    }
    Student[] students;
    uint studentCount;

    function register_student(string memory name, uint age) external {
        studentCount++;
        students.push(Student(studentCount, name, age, StudentStatus.ACTIVE));
    }

    function update_student(uint id, string memory name, uint age, StudentStatus status) external {
        require(id < students.length, "Student not found");
        students[id].name = name;
        students[id].age = age;
        students[id].status = status;
    }

    function remove_student(uint id) external {
        require(id < students.length, "Student not found");
        delete students[id];
    }

    function get_student_by_id(uint id) external view returns (Student memory) {
        for (uint i = 0; i < students.length; i++) {
            if (students[i].id == id) {
                return students[i];
            }
        }
        revert("Student not found");
    }

    function get_all_students() external view returns (Student[] memory) {
        return students;
    }
}
