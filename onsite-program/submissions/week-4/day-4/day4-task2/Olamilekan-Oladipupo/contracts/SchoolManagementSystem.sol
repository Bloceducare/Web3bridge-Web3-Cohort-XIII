// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

contract SchoolManagementSystem {
    error STUDENT_NOT_FOUND();
    error INVALID_ID();
    error INVALID_SENDER();
    error INVALID_ADDRESS();


    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    struct StudentDetails {
        uint256 id;
        string name;
        string course;
        uint256 age;
        Status status;
        address studentAddress;
    }


    uint256 private uid;

    StudentDetails[] public students;
    mapping(address => StudentDetails) school; 


    function register_student(string memory _name, string memory _course, uint256 _age) external {
        require(school[msg.sender].studentAddress == address(0), "student already exist");

        uid = uid + 1;

        StudentDetails memory _student_details = StudentDetails(uid, _name, _course, _age, Status.ACTIVE, msg.sender);

        students.push(_student_details);
        school[msg.sender] = _student_details;

    }

    function update_student(string memory _new_name) external {
        require(school[msg.sender].studentAddress != address(0), "student does not exist");
        for (uint256 i; i < students.length; i++) {
            if (students[i].studentAddress == msg.sender) {
                students[i].name = _new_name;
                school[msg.sender].name = _new_name;
                return;
            }
        }
    }

    function get_student_by_address(address _address) external view returns (StudentDetails memory) {
        require(school[_address].studentAddress != address(0), "student does not exist");

        for (uint256 i; i < students.length; i++) {
            if (students[i].studentAddress == _address) {
                return students[i];
            }
        }
        revert STUDENT_NOT_FOUND();
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

     function updateStudentStatusByAddress(address _studentAddress, Status _new_status) external {
        require(school[_studentAddress].studentAddress != address(0), "student does not exist");

        for (uint256 i; i < students.length; i++) {
            if (students[i].studentAddress == _studentAddress) {
                students[i].status = _new_status;
                return;
            }
        }

        revert INVALID_ADDRESS();
    }

    function delete_student_by_id(uint256 _student_id) external {
        for (uint256 i; i < students.length; i++) {
            if (students[i].id == _student_id) {
                students[i] = students[students.length - 1];
                students.pop();

                return;
            }
        }
        revert STUDENT_NOT_FOUND();
    }
     function deleteStudentByAddress(address _studentAddress) external {
        for (uint256 i; i < students.length; i++) {
            if (students[i].studentAddress == _studentAddress) {
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
