// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IStaffSalaryManager {
    enum Status {
        EMPLOYED,
        PROBATION,
        UNEMPLOYED
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

    function addStaff(
        address _address,
        string memory _name,
        Role _role
    ) external;

    function getStaff(address _address) external view returns (Staff memory);

    function getTotalStaffs() external view returns (uint256);

    function updateStaff(address _address, Status _status, Role _role) external;

    function paySalary(address payable _staffAddress) external;
}
