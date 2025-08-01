// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28;

contract SchoolManagementSystem {

    struct Student {
        string name;
        uint age;
        string email;
        Gender gender;
        Status status;
        string school_name;
    }
    enum Gender {
        male,
        female
    }

    enum Status { 
        ACTIVE,
        DEFERRED,
        RUSTICATED 
    }

    address[] public studentAddresses;

    mapping (address => Student ) public students;

    function RegisterStudent (string memory _name, uint _age, string memory _email, Gender _gender, Status _status, string memory _school_name) external {
        students[msg.sender] = Student(_name, _age, _email, _gender, _status, _school_name);
    }

    function UpdateStudent (string memory _new_name, uint _new_age) external {
        Student storage student = students[msg.sender];
        student.name = _new_name;
        student.age = _new_age;
    }

    function DeleteStudent () external {
        delete students[msg.sender];
    }

    function ChangeStatus (Status _new_status) external {
        students[msg.sender].status = _new_status;
    }

    function ViewStudent() external view returns(string memory name, uint age, string memory email, Gender gender, Status status) {
        Student memory student = students[msg.sender];
        return (student.name, student.age, student.email, student.gender, student.status);
    }

    function ViewStudents() external view returns (Student[] memory) {
        Student[] memory allStudents = new Student[](studentAddresses.length);
        for (uint i; i < studentAddresses.length; i++) {
            allStudents[i] = students[studentAddresses[i]];
        }
        return  allStudents;
    }
}