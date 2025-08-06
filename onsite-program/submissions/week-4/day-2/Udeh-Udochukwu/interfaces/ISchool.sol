// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ISchool{
    // Custom errors
    error STUDENT_NOT_FOUND();
    error INVALID_ID();
    error INVALID_SENDER();

    // Enum for student status
    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    // Struct for student details
    struct StudentDetails{
        uint256 id;
        string name;
        string course;
        uint256 age;
        Status status;
    }

    // External functions
    function register_student(string memory _name, string memory _course, uint256 _age, address _address) external;
    
    function update_student(uint256 _student_id, string memory _new_name) external;
    
    function get_student_by_id(uint256 _student_id) external view returns (StudentDetails memory);
    
    function update_students_status(uint256 _student_id, Status _new_status) external;
    
    function delete_student(uint256 _student_id) external;
    
    function get_all_students() external view returns (StudentDetails[] memory);
    
    function getStudentsByAddress(address _address) external view returns (StudentDetails[] memory);
}