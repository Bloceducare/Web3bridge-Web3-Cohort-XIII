// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IEmployeeManagement {
    
    enum Role { MENTOR, ADMIN, SECURITY }
    enum Status { ACTIVE, INACTIVE, TERMINATED }

    struct Employee {
        string name;
        Role role;
        Status status;
        uint256 salary;
        uint256 totalPaid;
    }

    function addEmployee(address _employeeAddress, string memory _name, Role _role, uint256 _salary) external;
    function canAccessGarage(address _employeeAddress) external view returns (bool);
    function getAllEmployees() external view returns (Employee[] memory);
    function getEmployeeDetails(address _employeeAddress) external view returns (Employee memory);
    function disburseSalary(address _employeeAddress) external payable;
}