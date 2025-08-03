// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ITeacherSalaryManager {
    enum Status {
        EMPLOYED,
        UNEMPLOYED,
        PROBATION
    }

    enum Role {
        MENTOR,
        ADMIN,
        SECURITY
    }

    struct Staff {
        string name;
        uint256 salary;
        Status status;
        Role role;
    }

    function addTeacher(
        string memory _name,
        Status _status,
        Role _role
    ) external;

    function getStaff(address _address) external view returns (Staff memory);

    function getTotalStaffs() external view returns (uint256);

    function updateStaffStatus(address _address, Status _status) external;

    function paySalary(address payable _staffAddress) external;
}
