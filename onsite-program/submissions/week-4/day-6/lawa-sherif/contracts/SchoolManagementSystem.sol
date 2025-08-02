// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../library/Error.sol";
import "../interface/ITeacherManagement.sol";

contract SchoolManagementSystem {
    address public owner;
    uint256 private uid;
    mapping(address => Teacher) private teacherMapping;
    Teacher[] public teachers;

    // Constructor to set the owner
    constructor() {
        owner = msg.sender;
    }

    // Modifier to restrict access to owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier teacherExists(address _teacher) {
        require(teacherMapping[_teacher].aza != address(0), "Teacher does not exist");
        _;
    }

    modifier teacherEmployed(address _teacher) {
        require(teacherMapping[_teacher].status == Status.EMPLOYED, "Teacher not employed");
        _;
    }

    // Function to register a teacher
    function registerTeacher(
        string memory _name,
        uint256 _salary,
        address _aza
    ) external onlyOwner {
        // Check if teacher already exists
        require(teacherMapping[_aza].aza == address(0), "Teacher already exists");
        
        uid++;

        Teacher memory _teacher = Teacher(
            uid,
            _aza,
            _name,
            _salary,
            Status.EMPLOYED
        );

        teacherMapping[_aza] = _teacher;
        teachers.push(_teacher);
    }

    // Function to get all teachers
    function getAllTeachers() external view returns (Teacher[] memory) {
        return teachers;
    }

    // Function to pay a teacher
    function payTeacher(address payable _teacher)
        external
        onlyOwner
        teacherExists(_teacher)
        teacherEmployed(_teacher)
    {
        uint256 salaryAmount = teacherMapping[_teacher].salary;

        require(address(this).balance >= salaryAmount, "Insufficient contract balance");

        (bool success, ) = _teacher.call{value: salaryAmount}("");
        require(success, "Transfer failed");
    }

    // Function to get contract balance
    function get_balance() external view returns (uint256) {
        return address(this).balance;
    }

    // Function to check if staff is active
    function active_staff(address _address) external view returns (bool) {
        return teacherMapping[_address].status == Status.EMPLOYED;
    }

    receive() external payable {}

    fallback() external payable {}
}