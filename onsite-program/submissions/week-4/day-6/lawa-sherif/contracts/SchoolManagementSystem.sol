// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Staff.sol";

contract SchoolManagementSystem {
    error TEACHER();
    error INVALID_ID();
    error INVALID_OWNER();
    error YOURE_A_THIEF();
    error InsufficientFunds();

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "you are not the school owner");
        _;
    }

    enum Status {
        UNEMPLOYED,
        EMPLOYED,
        ON_PROBATION
    }

    struct Teacher {
        uint256 id;
        address aza;
        string name;
        uint8 salary;
        Status status;
    }

    uint256 private uid;

    mapping(address => Teacher) private teacherMapping;
    Teacher[] public teachers;

    receive() external payable {}
    fallback() external {}

    function unboard_teacher(
        string memory _name, 
        uint8 _salary, 
        address _aza
    ) external {
        uid++;

        Teacher memory _teacher = Teacher(
            uid,
            _aza,
            _name,
            _salary,
            Status.UNEMPLOYED
        );

        teacherMapping[msg.sender] = _teacher;
        teachers.push(_teacher);
    }

    function get_balance() external view returns (uint256) {
        return address(this).balance;
    }

    function transfer(address payable _to, uint256 _salary) external onlyOwner {
        if (owner != msg.sender) {
            revert YOURE_A_THIEF();
        }
        _to.transfer(_salary);
    }

    function active_staff(address _address) external view {
        require(
            teacherMapping[_address].status == Status.EMPLOYED,
            "You are not an active staff"
        );
    }

    modifier teacherExists(address _teacher) {
        require(teacherMapping[_teacher].aza != address(0), "Teacher does not exist");
        _;
    }

    modifier teacherEmployed(address _teacher) {
        require(teacherMapping[_teacher].status == Status.EMPLOYED, "Teacher not employed");
        _;
    }

    function disburseSalaryToTeacher(address payable _teacher) 
        external 
        onlyOwner 
        teacherExists(_teacher)
        teacherEmployed(_teacher)
    {
        uint256 salaryAmount = teacherMapping[_teacher].salary;

        if (address(this).balance < salaryAmount) revert InsufficientFunds();

        (bool success, ) = _teacher.call{value: salaryAmount}("");
        require(success, "Transfer failed");
    }
}
