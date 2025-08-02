// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

enum Status {
    UNEMPLOYED,
    EMPLOYED,
    ON_PROBATION
}

struct Teacher {
    uint256 id;
    address aza;
    string name;
    uint256 salary;
    Status status;
}

interface ITeacherManagement {
    function registerTeacher(
        string memory _name,
        uint256 _salary,
        address _aza
    ) external;

    function getAllTeachers() external view returns (Teacher[] memory);

    function payTeacher(address payable _teacher) external;

    function get_balance() external view returns (uint256);

    function active_staff(address _address) external view returns (bool);
}