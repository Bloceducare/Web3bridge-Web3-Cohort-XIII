// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

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
    }

    struct School {
        address owner;
        StudentDetails[] students;
    }

    error INVALID_SENDER();

    uint256 private uid;
    mapping(address => School) schools;

    // this is just another type of reg
    function another_registration(StudentDetails memory details) external {
        uid = uid + 1;

        details = StudentDetails(
            uid,
            details.name,
            details.course,
            details.age,
            Status.ACTIVE
        );

        schools[msg.sender].students.push(details);
        schools[msg.sender].owner = msg.sender;
    }

    function register_student(
        string memory _name,
        string memory _course,
        uint256 _age
    ) external {
        uid = uid + 1;
        uint new_uid = schools[msg.sender].students.length + 1;

        StudentDetails memory _student_details = StudentDetails(
            new_uid,
            _name,
            _course,
            _age,
            Status.ACTIVE
        );

        schools[msg.sender].students.push(_student_details);
        schools[msg.sender].owner = msg.sender;
    }

    function update_student(
        uint256 _student_id,
        string memory _new_name
    ) external {
        StudentDetails[] storage students_of_owner = schools[msg.sender]
            .students;
        for (uint256 i; i < students_of_owner.length; i++) {
            if (students_of_owner[i].id == _student_id) {
                students_of_owner[i].name = _new_name;
                return;
            }
        }

        revert INVALID_ID();
    }

    function get_student_by_id(
        uint256 _student_id
    ) external view returns (StudentDetails memory) {
        StudentDetails[] memory students_of_owner = schools[msg.sender]
            .students;

        StudentDetails memory student_to_return;

        for (uint256 i; i < students_of_owner.length; i++) {
            if (students_of_owner[i].id == _student_id) {
                student_to_return = students_of_owner[i];
            }
        }
        return student_to_return;
    }

    function update_students_status(
        uint256 _student_id,
        Status _new_status
    ) external {
        StudentDetails[] storage students_of_owner = schools[msg.sender]
            .students;

        for (uint256 i; i < students_of_owner.length; i++) {
            if (students_of_owner[i].id == _student_id) {
                students_of_owner[i].status = _new_status;
                return;
            }
        }

        revert INVALID_ID();
    }

    function delete_student(uint256 _student_id) external {
        StudentDetails[] storage students_of_owner = schools[msg.sender]
            .students;

        for (uint256 i; i < students_of_owner.length; i++) {
            if (students_of_owner[i].id == _student_id) {
                students_of_owner[i] = students_of_owner[
                    students_of_owner.length - 1
                ];
                students_of_owner.pop();
                return;
            }
        }

        revert STUDENT_NOT_FOUND();
    }

    function get_all_students()
        external
        view
        returns (StudentDetails[] memory)
    {
        return schools[msg.sender].students;
    }
}
