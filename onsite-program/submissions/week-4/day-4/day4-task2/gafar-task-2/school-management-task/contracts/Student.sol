// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

enum StudentStatus {
    ACTIVE,
    DEFERRED,
    RUSTICATED
}

error INVALID_NAME_OR_AGE();
error USER_NOT_FOUND();
error ZERO_ADDRESS();

contract StudentRecord {
    struct Student {
        string name;
        uint age;
        StudentStatus status;
    }
    Student[] students;
    mapping(address => Student) public studentRecord;

    function register_student(string memory name, uint age) external {
        studentRecord[msg.sender] = Student(name, age, StudentStatus.ACTIVE);
        students.push(studentRecord[msg.sender]);
    }

    function update_student(string memory name, uint age, StudentStatus status) external {
        Student storage student = studentRecord[msg.sender];
        student.name = name;
        student.age = age;
        student.status = status;
    }

    function remove_student() external {
        delete studentRecord[msg.sender];
    }

    function get_student_by_id(address _address) external view returns (Student memory) {
        if(_address == address(0)){ 
            revert ZERO_ADDRESS();
        }
        Student storage student = studentRecord[_address];
        return student;
    }

    function get_all_students() external view returns (Student[] memory) {
        return students;
    }
}
