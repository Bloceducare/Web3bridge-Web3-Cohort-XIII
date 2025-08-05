// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IEMS {
    enum EmploymentStatus {
        Employed,
        NotEmployed,
        OnProbation
    }

    enum Role {
        Mentor,
        Admin,
        Security
    }

    struct Employee {
        address userAddress;
        uint balance;
        uint salary;
        Role role;
        EmploymentStatus status;
    }

    function registerUser(uint _salary, Role _role) external;
    function getBalance(address _address) external view returns (uint);
    function paySalary(address payable _employee_address) external;
    function getEmployees() external view returns (Employee[] memory);
    function getAnEmployee(address _userAddress) external view returns (Employee memory);
}
