// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IManagementSystem {
    enum UserType { MENTOR, ADMIN, SECURITY }
    
    struct Employee {
        string name;
        UserType userType;
        uint256 salary;
        bool isEmployed;
    }
    
    function registerEmployee(address _employee, string memory _name, UserType _userType, uint256 _salary) external;
    function paySalary(address _employee, uint256 _amount) external;
    function getAllEmployees() external view returns (address[] memory);
    function getEmployee(address _employee) external view returns (Employee memory);
}

