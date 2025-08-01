// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract SchoolManagementSystem {
    error STUDENT_NOT_FOUND();
    error INVALID_ID();

    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    struct StudentDetails {
        address addr;
        uint256 id;
        string name;
        string course;
        uint256 age;
        Status status;
    }

    error INVALID_SENDER();

    mapping (address => StudentDetails) addressToStudentDetails;

    uint256 private uid;

    StudentDetails[] public students;

   

    function register_student(address _addr, string memory _name, string memory _course, uint256 _age) external {
        uid = uid + 1;

        StudentDetails memory _student_details = StudentDetails(_addr, uid, _name, _course, _age, Status.ACTIVE);
        addressToStudentDetails[_addr] = _student_details;
        students.push(_student_details);
    }

    function update_student(address _addr, string memory _new_name, string memory _new_course, uint256 _new_age) external {
       
       StudentDetails memory student = addressToStudentDetails[_addr];

       student.name = _new_name;
       student.age = _new_age;
       student.course = _new_course;
       addressToStudentDetails[_addr] = student;

             
       
        for (uint256 i; i < students.length; i++) {
            if (students[i].addr == _addr) {
                students[i].name = _new_name;
                students[i].course = _new_course;
                students[i].age = _new_age;
                return;
            }
        }

        revert STUDENT_NOT_FOUND();
    }

    function get_student_by_address(address _addr) external view returns (StudentDetails memory) {
        // require(_student_id <= students.length, "invalid id");
        return addressToStudentDetails[_addr];
    }

    function update_students_status(address _addr, Status _new_status) external {
        // require(_student_id <= students.length, "invalid id");

        StudentDetails memory student = addressToStudentDetails[_addr];
        student.status = _new_status;
        addressToStudentDetails[_addr] = student;
       
        for (uint256 i; i < students.length; i++) {
            if (students[i].addr == _addr) {
                students[i].status = _new_status;
                return;
            }
        }

        revert STUDENT_NOT_FOUND();
    }

    function delete_student(address _addr) external {
        
        delete addressToStudentDetails[_addr];
        
        for (uint256 i; i < students.length; i++) {
            if (students[i].addr == _addr) {
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
}
