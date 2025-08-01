//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

//creating a student management system that manages student databases
contract StudentManagementSystem {
    struct Studentdata {
        string firstname;
        string lastname;
        uint256 age;
        Gender gender;
        Status status;
    }

    enum Gender {
        MALE,
        FEMALE
    }

    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    mapping(address => Studentdata) public studentdata;

    Studentdata[] public studentdatamanagement;

    //function to create student data
    function createStudentdata(
        string memory _firstname,
        string memory _lastname,
        uint256 age,
        Gender _gender,
        Status _status
    ) external {
        studentdata[msg.sender] = Studentdata(
            _firstname,
            _lastname,
            age,
            _gender,
            _status
        );
        studentdatamanagement.push( studentdata[msg.sender]);
    }

    //function to update student data
    function updateStudentdata(
        uint256 _index,
        string memory _new_firstname,
        string memory _new_lastname,
        uint256 _new_age,
        Gender _new_gender,
        Status _new_status
    ) external {
        require(_index < studentdatamanagement.length, "Index out of bounds");
        studentdatamanagement[_index] = Studentdata(
            _new_firstname,
            _new_lastname,
            _new_age,
            _new_gender,
            _new_status
        );
    }

    //function to get studentdata values
    function getStudentdata() external view returns (Studentdata[] memory) {
        return studentdatamanagement;
    }

    //function to delete student data
    function deleteStudentdata(uint256 _index) external {
        require(_index < studentdatamanagement.length, "Invalid Student Index");
        delete studentdatamanagement[_index];
    }
}

// This contract allows for the management of student data, including creation, updating, retrieval, and deletion of student records.


