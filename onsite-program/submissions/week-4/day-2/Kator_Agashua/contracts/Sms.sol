// A smart contract for a Student Management System

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

contract Sms {
    // An enum for student status
    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    // An enum for student gender
    enum Gender {
        MALE,
        FEMALE
    }

    // A student struct
    struct Student {
        bytes16 id;  // Changed from bytes8 to bytes16 to match usage
        string first_name;
        string last_name;
        uint256 age;
        Gender gender;
        Status status;
    }

    // An array to hold student structs
    Student[] public studentList;

    // Function to add student
    function addStudent(
        string memory _first_name,
        string memory _last_name,
        uint256 _age,
        Gender _gender,
        Status _status
    ) external {
        string memory fullName = string(
            abi.encodePacked(_first_name, " ", _last_name)
        );
        bytes16 id = bytes16(keccak256(abi.encodePacked(fullName)));
        studentList.push(
            Student(id, _first_name, _last_name, _age, _gender, _status)
        );
    }

    // Function to update student data
    function updateStudent(
        uint256 _index,
        string memory _first_name,
        string memory _last_name,
        uint256 _age,
        Status _status
    ) external {
        require(_index < studentList.length, "Invalid student index");

        if (
            bytes(_first_name).length != 0 &&
            bytes(_last_name).length != 0 &&
            (_age > 0)
        ) {
            studentList[_index].first_name = _first_name;
            studentList[_index].last_name = _last_name;
            studentList[_index].age = _age;
            studentList[_index].status = _status;
        }
    }

    // Function to get student by id
    function getStudent(bytes16 _id)
        external
        view
        returns (
            string memory,
            string memory,
            uint256,
            string memory,
            string memory
        )
    {
        for (uint256 i = 0; i < studentList.length; i++) {
            if(studentList[i].id == _id) {
                return (
                    studentList[i].first_name,
                    studentList[i].last_name,
                    studentList[i].age,
                    GenderToString(studentList[i].gender),
                    StatusToString(studentList[i].status)
                );
            }
        }
        revert("Student not found");
    }

    // Function to delete student
    function deleteStudent(uint256 _index) external {
        require(_index < studentList.length, "Invalid student index");
        delete studentList[_index];
    }

    // Function to get the total number of students
    function getTotalStudents() external view returns (uint256) {
        return studentList.length;
    }

    // Function to get all students
    function getAllStudents() external view returns (Student[] memory) {
        return studentList;
    }

    function GenderToString(Gender _gender)
        public
        pure
        returns (string memory)
    {
        string memory gender = _gender == Gender.MALE ? "MALE" : "FEMALE";
        return gender;
    }

    function StatusToString(Status _status)
        public
        pure
        returns (string memory)
    {
        string memory status;
        if (_status == Status.ACTIVE) {
            status = "ACTIVE";
        } else if (_status == Status.DEFERRED) {
            status = "DEFERRED";
        } else {
            status = "RUSTICATED";
        }
        return status;
    }
}