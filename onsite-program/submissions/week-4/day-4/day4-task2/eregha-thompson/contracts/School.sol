// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

contract SchoolManagementSystem {
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
        address owner;
    }
   

    error INVALID_SENDER();

    mapping (address => StudentDetails) public student_details;

    uint256 private uid;

    StudentDetails[] public students;

    function another_registration(StudentDetails memory details) external {
        uid = uid + 1;

        details = StudentDetails(uid, details.name, details.course, details.age, Status.ACTIVE, msg.sender);

        students.push(details);
    }

    function register_student(string memory _name, string memory _course, uint256 _age) external {
        uid = uid + 1;

        StudentDetails memory _student_details = StudentDetails(uid, _name, _course, _age, Status.ACTIVE, msg.sender);
student_details[msg.sender] = _student_details;
        students.push(_student_details);
    }

    function update_student(uint256 _student_id, string memory _new_name) external {
        for (uint256 i; i < students.length; i++) {
            if (students[i].id == _student_id) {
                students[i].name = _new_name;
            }
        }
    }
    function update_student_by_address(address _studentAddress, string memory _new_name) external {
        for (uint256 i; i < students.length; i++) {
            if (students[i].owner == _studentAddress) {
                students[i].name = _new_name;
                student_details[_studentAddress].name = _new_name;
            }
        }
    }

    function get_student_by_id(uint256 _student_id) external view returns (StudentDetails memory) {
        // require(_student_id <= students.length, "invalid id");

        for (uint256 i; i < students.length; i++) {
            if (students[i].id == _student_id) {
                return students[i];
            }
        }
    }

    function get_student_by_address(address _studentAddress) external view returns(StudentDetails memory){
        if (_studentAddress==msg.sender) {
            return student_details[_studentAddress];
        }
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
    function update_students_status_by_address(address _studentAddress, Status _new_status) external {
        if (_studentAddress == msg.sender) {
            student_details[_studentAddress].status = _new_status;
        }
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
}
