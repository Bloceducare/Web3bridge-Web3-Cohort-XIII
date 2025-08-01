// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

enum StudentStatus {
    ACTIVE,
    DEFERRED,
    RUSTICATED
}

error INVALID_NAME_OR_AGE();
error USER_NOT_FOUND();

contract StudentRecord {
    struct Student {
        string name;
        uint age;
        StudentStatus status;
    }
    Student[] students;
    mapping(address => Student) public studentRecord;

    function register_student(address _address, string memory name, uint age) external {
        studentRecord[_address] = Student(name, age, StudentStatus.ACTIVE);
        students.push(studentRecord[_address]);
    }

    function update_student(address _address, string memory name, uint age, StudentStatus status) external {
        // if(studentRecord[_address].name == "" || studentRecord[_address].age == 0) revert INVALID_NAME_OR_AGE();
        if(_address == address(0)) revert USER_NOT_FOUND();
        Student storage student = studentRecord[_address];
        student.name = name;
        student.age = age;
        student.status = status;
    }

    function remove_student(address _address) external {
        delete studentRecord[_address];
    }

    function get_student_by_id(address _address) external view returns (Student memory) {
        if(_address == address(0)){ 
            revert USER_NOT_FOUND();
        }
        Student storage student = studentRecord[_address];
        return student;
    }

    function get_all_students() external view returns (Student[] memory) {
        return students;
    }
}
