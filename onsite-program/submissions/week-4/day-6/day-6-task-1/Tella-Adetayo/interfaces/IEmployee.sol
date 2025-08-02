// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IEmployee {

    struct Employee {
        string name;
        string role;
        bool isEmployed;
        uint256 amountPaid;
        uint256 salary;
    }

    function registerUser(
        string memory _name,
        string memory _role,
        uint256 _salary,
        bool _isEmployed
    ) external;

    function updateEmploymentStatus(
        address employeeAddress,
        string memory role,
        uint256 salary,
        bool isEmployed
    ) external;

    function payout(address addr, uint256 amount) external;

    function getAllUsers() external view returns (address[] memory);

    function getUserDetails(address addr) external view returns (Employee memory);
}
