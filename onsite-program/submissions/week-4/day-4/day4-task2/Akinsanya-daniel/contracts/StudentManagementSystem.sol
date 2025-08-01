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
        uint256 id;
        string name;
        string course;
        uint256 age;
        Status status;
        address studentAddress;
    }

    error INVALID_SENDER();

    mapping (address => StudentDetails) student;

    uint256 private uid;

    StudentDetails[] public students;

    

    function register_student(string memory _name, string memory _course, uint256 _age) external {
        uid = uid + 1;
        require(student[msg.sender].studentAddress == address(0), "student already registered");

        StudentDetails memory _student_details;
        _student_details.id = uid;
        _student_details.name = _name;
        _student_details.course = _course;
        _student_details.age = _age;
        _student_details.status = Status.ACTIVE;
        _student_details.studentAddress = msg.sender;
        students.push(_student_details);
        student[msg.sender] = _student_details;
    }

    function update_student(uint256 _student_id, string memory _new_name) external {
     require(student[msg.sender].studentAddress != address(0), "Student not found");

        for (uint256 i; i < students.length; i++) {
            if (students[i].id == _student_id) {
                students[i].name = _new_name;
                student[msg.sender].name = _new_name;
                return;
            }
        }
        revert STUDENT_NOT_FOUND();
    }

    function get_student_by_id(uint256 _student_id) external view returns (StudentDetails memory) {
        // require(_student_id <= students.length, "invalid id");

        for (uint256 i; i < students.length; i++) {
            if (students[i].id == _student_id) {
                return students[i];
            }
        }
           revert STUDENT_NOT_FOUND();
    }

    function update_students_status(uint256 _student_id, Status _new_status) external {
        require(_student_id <= students.length, "invalid id");
        require(student[msg.sender].studentAddress != address(0), "Student not found");

        

        for (uint256 i; i < students.length; i++) {
            if (students[i].id == _student_id) {
                students[i].status = _new_status;
                student[msg.sender].status = _new_status;   
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


    function get_student_by_address(address _student_address) external view returns (StudentDetails memory) {
          require(student[msg.sender].studentAddress != address(0), "Student not found");
          return student[_student_address];

}
}
