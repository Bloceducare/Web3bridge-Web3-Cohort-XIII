// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract SchoolManagementSystem {
    error STUDENT_NOT_FOUND();
    error INVALID_ID();
    error UNAUTHORIZED();

    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    struct StudentDetails {
        address addy;
        uint256 id;
        string name;
        string course;
        uint256 age;
        Status status;
    }

    uint256 private uid;

    StudentDetails[] public students;
    mapping(address => StudentDetails) private userToStudent;
    mapping(address => bool) private isRegistered;

    function register_student(string memory _name, string memory _course, uint256 _age) external {
        require(!isRegistered[msg.sender], "Student already registered");

        uid++;
        StudentDetails memory _student = StudentDetails({
            addy: msg.sender,
            id: uid,
            name: _name,
            course: _course,
            age: _age,
            status: Status.ACTIVE
        });

        students.push(_student);
        userToStudent[msg.sender] = _student;
        isRegistered[msg.sender] = true;
    }

    function update_student(string memory _new_name, string memory _new_course, uint256 _new_age) external {
        if (!isRegistered[msg.sender]) revert STUDENT_NOT_FOUND();

        StudentDetails storage student = userToStudent[msg.sender];
        student.name = _new_name;
        student.course = _new_course;
        student.age = _new_age;

        // Also update in the array for consistency
        for (uint i = 0; i < students.length; i++) {
            if (students[i].addy == msg.sender) {
                students[i].name = _new_name;
                students[i].course = _new_course;
                students[i].age = _new_age;
                break;
            }
        }
    }

    function update_status(Status _new_status) external {
        if (!isRegistered[msg.sender]) revert STUDENT_NOT_FOUND();

        userToStudent[msg.sender].status = _new_status;

        for (uint i = 0; i < students.length; i++) {
            if (students[i].addy == msg.sender) {
                students[i].status = _new_status;
                break;
            }
        }
    }

    function get_my_details() external view returns (StudentDetails memory) {
        if (!isRegistered[msg.sender]) revert STUDENT_NOT_FOUND();
        return userToStudent[msg.sender];
    }

    function get_student_by_id(uint256 _id) external view returns (StudentDetails memory) {
        for (uint i = 0; i < students.length; i++) {
            if (students[i].id == _id) {
                return students[i];
            }
        }
        revert STUDENT_NOT_FOUND();
    }

    function get_all_students() external view returns (StudentDetails[] memory) {
        return students;
    }

    function delete_my_account() external {
        if (!isRegistered[msg.sender]) revert STUDENT_NOT_FOUND();

        // Remove from array
        for (uint i = 0; i < students.length; i++) {
            if (students[i].addy == msg.sender) {
                students[i] = students[students.length - 1];
                students.pop();
                break;
            }
        }

        delete userToStudent[msg.sender];
        isRegistered[msg.sender] = false;
    }
}
