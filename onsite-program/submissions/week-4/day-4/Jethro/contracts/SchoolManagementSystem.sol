
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SchoolManagementSystem {
    enum Status { ACTIVE, DEFERRED, RUSTICATED }

    struct StudentDetails {
        uint256 id;
        string name;
        string course;
        uint256 age;
        Status status;
    }

    mapping(address => StudentDetails[]) public userStudents;
    mapping(address => uint256) private userNextId;

    function register_student(string memory _name, string memory _course, uint256 _age) external {
        uint256 newId = userNextId[msg.sender] + 1;
        userStudents[msg.sender].push(StudentDetails(newId, _name, _course, _age, Status.ACTIVE));
        userNextId[msg.sender] = newId;
    }

    function update_student(uint256 _id, string memory _new_name, string memory _new_course, uint256 _new_age) external {
        StudentDetails[] storage students = userStudents[msg.sender];
        require(_id > 0 && _id <= students.length, "Invalid student ID");
        students[_id - 1].name = _new_name;
        students[_id - 1].course = _new_course;
        students[_id - 1].age = _new_age;
    }

    function update_student_status(uint256 _id, Status _new_status) external {
        StudentDetails[] storage students = userStudents[msg.sender];
        require(_id > 0 && _id <= students.length, "Invalid student ID");
        students[_id - 1].status = _new_status;
    }

    function delete_student(uint256 _id) external {
        StudentDetails[] storage students = userStudents[msg.sender];
        require(_id > 0 && _id <= students.length, "Invalid student ID");
        students[_id - 1] = students[students.length - 1];
        students.pop();
    }

    function get_student_by_id(uint256 _id) external view returns (StudentDetails memory) {
        StudentDetails[] memory students = userStudents[msg.sender];
        require(_id > 0 && _id <= students.length, "Invalid student ID");
        return students[_id - 1];
    }

    function get_all_students() external view returns (StudentDetails[] memory) {
        return userStudents[msg.sender];
    }
}
