// SPDX-License-Identifier: UNLICENSED
import {ISchool} from "../interfaces/ISchool.sol";
pragma solidity ^0.8.28;


contract School is ISchool{

    uint256 private uid;

    StudentDetails[] public students;

    mapping(address => StudentDetails[]) public addressToStudents;

    function register_student(string memory _name, string memory _course, uint256 _age, address _address) external {
        uid = uid + 1;
        StudentDetails memory _student_details = StudentDetails(uid, _name, _course, _age, Status.ACTIVE);
        students.push(_student_details);
        addressToStudents[_address] = students;
    }

    function update_student(uint256 _student_id, string memory _new_name) external {
        for (uint256 i; i < students.length; i++) {
            if (students[i].id == _student_id) {
                students[i].name = _new_name;
            }
        }
    }
    function get_student_by_id(uint256 _student_id) external view returns (StudentDetails memory) {
        for (uint256 i; i < students.length; i++) {
            if (students[i].id == _student_id) {
                return students[i];
            }
        }
        revert STUDENT_NOT_FOUND(); 
    }


    function update_students_status(uint256 _student_id, Status _new_status) external {
        require(_student_id <= students.length, "invalid id");

        for (uint256 i; i < students.length; i++) {
            if (students[i].id == _student_id) {
                students[i].status = _new_status;
                return;
            }
        }

        revert INVALID_ID();
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

    function get_all_students() external view returns (StudentDetails[] memory) {
        return students;
    }

     function getStudentsByAddress(address _address) external view returns (StudentDetails[] memory) {
        return addressToStudents[_address];
    }
}