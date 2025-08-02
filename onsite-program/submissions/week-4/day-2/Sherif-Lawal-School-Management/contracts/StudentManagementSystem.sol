// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


contract StudentManagementSystem {

    error INVALID_STUDENT();
    
    struct Student {
        string name;
        uint age;
        Status status;
        Gender gender;
    }

    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    enum Gender {
        MALE,
        FEMALE
    }

    mapping(address => Student) student;
    uint256 uniqueId = 0;

    function create_student(
        string memory _name, 
        uint _age,
        Gender _gender
    ) external {
        Student memory new_student_ = Student(
            _name,
            _age,
            Status.ACTIVE,
            _gender
        );
        
        student[msg.sender] = new_student_;
        uniqueId++;
    }
        
    function update_student(
        string memory _new_name,
        uint _new_age
    ) external {
        student[msg.sender].name = _new_name;
        student[msg.sender].age = _new_age;
    }

    function get_student_by_address(
        address _address
    ) external view returns (Student memory) {
        return student[_address];
    }

    function update_student_status(Status _new_status) external {
        student[msg.sender].status = _new_status;
    }

    function delete_student() external {
        delete student[msg.sender];
    }
}