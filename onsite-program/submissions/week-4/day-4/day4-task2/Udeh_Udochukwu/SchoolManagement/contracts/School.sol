// SPDX-License-Identifier: MIT

pragma solidity ^0.8.29;

contract SchoolManagementSystem{

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

        StudentDetails memory _student_details = StudentDetails(uid, _name, _course, age, Status.ACTIVE);
        students.push(_student_details);
    }

    function update_student(uint256 _student_id, string memory _new_name) external {
        require (_student_id <= students.length, "Student does not exist");

        for (uint256 i; i < students.length; i++) {
            if (students[i].id == _student_id) {
                students[i].name = _new_name;
            }    
        }
    }

    function update_students_status(uint256 _student_id, Status _new_status) external {
        require(_student_id <= students.length, "invalid id");
        for(uint256 i; i < students.length; i++) {
            if (students[i].id == _student_id) {
                students[i].status = _new_status;
                return;
            }
        }

        revert STUDENT_NOT_FOUND();
    }

    function get_student_by_id() external view returns (StudentDetails[] memory) {
        return students;
    }

    function get_student_by_id(uint256 _student_id) external view returns (StudentDetails memory) {
        require(_student_id <= students.length, "invalid id");
        for(uint256 i; i < students.length; i++) {
            if (students[i].id == _student_id) {
                return students[i];
            }

        }
        revert STUDENT_NOT_FOUND();
    }

    function delete_student(uint256 _student_id) external {
        for (uint256 i; i < students.length; i++) {
            if (students[i].id == _student_id) {
                students[i] = students[students.length - 1];
                students.pop();
                return;
            }
        }
        revert STUDENT_NOT_FOUND();
    }
}
