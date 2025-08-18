// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IEmployeeManagement {
    function registerEmployee(address _employee, uint8 _userType, uint256 _salary) external;
    function isEmployed(address _employee) external view returns (bool);
    function disburseSalary(address _employee) external payable;
    function getEmployee(address _employee) external view returns (uint8, uint256, uint256);
    function getAllEmployees() external view returns (address[] memory);
}

error EmployeeManagement__NotAdmin();
error EmployeeManagement__AlreadyRegistered();
error EmployeeManagement__NotEmployed();
error EmployeeManagement__InsufficientFunds();
error EmployeeManagement__InvalidUserType();

contract EmployeeManagement is IEmployeeManagement {
    enum UserType { Mentor, Admin, Security }

    struct Employee {
        UserType userType;
        uint256 salary;
        uint256 paidAmount;
    }

    mapping(address => Employee) private employees;
    address[] private employeeList;
    address private immutable owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyAdmin() {
        if (employees[msg.sender].userType != UserType.Admin) revert EmployeeManagement__NotAdmin();
        _;
    }

    function registerEmployee(address _employee, uint8 _userType, uint256 _salary) external onlyAdmin {
        if (_userType > uint8(type(UserType).max)) revert EmployeeManagement__InvalidUserType();
        if (employees[_employee].salary > 0) revert EmployeeManagement__AlreadyRegistered();
        
        employees[_employee] = Employee(UserType(_userType), _salary, 0);
        employeeList.push(_employee);
    }

    function isEmployed(address _employee) external view returns (bool) {
        return employees[_employee].salary > 0;
    }

    function disburseSalary(address _employee) external payable onlyAdmin {
        if (employees[_employee].salary == 0) revert EmployeeManagement__NotEmployed();
        if (msg.value != employees[_employee].salary) revert EmployeeManagement__InsufficientFunds();

        employees[_employee].paidAmount += msg.value;
        (bool success, ) = _employee.call{value: msg.value}("");
        require(success, "Transfer failed");
    }

    function getEmployee(address _employee) external view returns (uint8, uint256, uint256) {
        Employee memory emp = employees[_employee];
        return (uint8(emp.userType), emp.salary, emp.paidAmount);
    }

    function getAllEmployees() external view returns (address[] memory) {
        return employeeList;
    }
}