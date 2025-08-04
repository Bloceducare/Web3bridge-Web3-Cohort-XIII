// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

contract Sms{

    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }
    
    struct StudentDetails {
        uint id;
        string name;
        string course;
        uint age;
        Status status;
    }
    error STUDENT_NOT_FOUND();
    uint public uid;
    mapping(address => StudentDetails) public studentData;
    mapping(address => bool) public isStudentRegistered;
    address[] public studentAddresses;

    function register_student(string memory _name, string memory _course, uint age) external {
        require(!isStudentRegistered[msg.sender], "Student already registered");
        uid = uid + 1;

        studentData[msg.sender] = StudentDetails(uid, _name, _course, age, Status.ACTIVE);
        isStudentRegistered[msg.sender] = true;
        studentAddresses.push(msg.sender);
    }

    function update_student(string memory _new_name) external {
        require (!isStudentRegistered[msg.sender], "Student not registered");
        studentData[msg.sender].name = _new_name;
    }

    function update_students_status(Status _new_status) external {
        require(!isStudentRegistered[msg.sender], "Student not registered");
        studentData[msg.sender].status = _new_status;
    }

    function getAllStudents() public view returns (address[] memory) {
        return studentAddresses;
    }

    function get_my_details() external view returns (StudentDetails memory) {
        require(isStudentRegistered[msg.sender], "Student not registered");
                return studentData[msg.sender];
    }

    function delete_student() external {
        require(isStudentRegistered[msg.sender], "Student not registered");
        delete studentData[msg.sender];
        isStudentRegistered[msg.sender] = false;
    }
}