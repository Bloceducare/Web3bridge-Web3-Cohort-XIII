// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract SchoolManagement {
    
    error STUDENT_NOT_FOUND();
    error INVALID_ID();

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
        address wallet;
    }

    error INVALID_SENDER();

    uint256 private uid;

    StudentDetails[] public students;

    mapping (address => StudentDetails) studentAddress;


    function register_student(string memory _name, string memory _course, uint256 _age, address _wallet) external {
        uid = uid + 1;

        StudentDetails memory _student_details = StudentDetails(uid, _name, _course, _age, Status.ACTIVE, _wallet);

        students.push(_student_details);

        studentAddress[_wallet] = _student_details;
    }

    function update_student(address _wallet, string memory _new_name) external {
        for (uint i; i < students.length; i++) {
            if (students[i].wallet == _wallet) {
                students[i].name = _new_name;
            }
        }
    }

    function get_student_by_id(address _wallet) external view returns (StudentDetails memory) {
        // require(_student_id <= students.length, "invalid id");

        for (uint256 i; i < students.length; i++) {
            if (students[i].wallet == _wallet) {
                return students[i];
            }
        }
        return studentAddress[_wallet];
    }

    function update_students_status(address _wallet, uint student_id, Status _new_status) external {
        require(student_id <= students.length, "invalid id");

        for (uint256 i; i < students.length; i++) {
            if (students[i].wallet == _wallet) {
                students[i].status = _new_status;
                return;
            }
        }

        revert INVALID_ID();
    }

    function delete_student(address _wallet) external {
        for (uint256 i; i < students.length; i++) {
            if (students[i].wallet == _wallet) {
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
