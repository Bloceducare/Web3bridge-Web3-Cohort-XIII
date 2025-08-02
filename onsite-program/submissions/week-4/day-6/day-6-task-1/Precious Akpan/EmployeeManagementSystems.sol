// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IEmployeeManagementSystem {
    function registerEmployee(address employee, uint8 employeeType, uint256 salary) external;
    function isEmployed(address employee) external view returns (bool);
    function payout(address employee) external payable;
    function getAllEmployees() external view returns (address[] memory);
    function getEmployeeDetails(address employee) external view returns (uint8, uint256, uint8, uint256);
    function setEmploymentStatus(address employee, uint8 status) external;
}

contract EmployeeManagementSystem is IEmployeeManagementSystem {
    enum EmployeeType { Mentor, Admin, Security }
    enum EmploymentStatus { Active, Suspended, Terminated, OnLeave }

    struct Employee {
        EmployeeType employeeType;
        uint256 salary;
        EmploymentStatus status;
        uint256 amountPaid;
    }

    mapping(address => Employee) private employees;
    mapping(address => bool) private isRegistered;
    address[] private employeeList;
    address public owner;

    event EmployeeRegistered(address indexed employee, EmployeeType employeeType, uint256 salary);
    event EmployeePayout(address indexed employee, uint256 amount);
    event EmployeeStatusChanged(address indexed employee, EmploymentStatus status);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyActive(address employee) {
        require(employees[employee].status == EmploymentStatus.Active, "Employee is not currently active");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerEmployee(address employee, uint8 employeeType, uint256 salary) external override onlyOwner {
        require(employee != address(0), "Invalid address");
        require(salary > 0, "Salary must be greater than zero");
        require(employeeType <= uint8(EmployeeType.Security), "Invalid employee type");
        require(!isRegistered[employee], "Employee already registered");

        employees[employee] = Employee({
            employeeType: EmployeeType(employeeType),
            salary: salary,
            status: EmploymentStatus.Active,
            amountPaid: 0
        });
        isRegistered[employee] = true;
        employeeList.push(employee);
        emit EmployeeRegistered(employee, EmployeeType(employeeType), salary);
    }

    function isEmployed(address employee) public view override returns (bool) {
        return employees[employee].status == EmploymentStatus.Active;
    }

    function payout(address employee) external override payable onlyOwner onlyActive(employee) {
        Employee storage emp = employees[employee];
        require(emp.amountPaid < emp.salary, "Employee has already been fully paid");
        require(msg.value > 0, "No Ether sent");
        require(emp.amountPaid + msg.value <= emp.salary, "Amount exceeds agreed salary");

        emp.amountPaid += msg.value;
        (bool sent, ) = employee.call{value: msg.value}("");
        require(sent, "Failed to send Ether");
        emit EmployeePayout(employee, msg.value);
    }

    function setEmploymentStatus(address employee, uint8 status) external onlyOwner {
        require(status <= uint8(EmploymentStatus.OnLeave), "Invalid status");
        require(employees[employee].status != EmploymentStatus.Terminated, "Cannot change status of terminated employee");
        employees[employee].status = EmploymentStatus(status);
        emit EmployeeStatusChanged(employee, EmploymentStatus(status));
    }

    function getAllEmployees() external view override returns (address[] memory) {
        return employeeList;
    }

    function getEmployeeDetails(address employee) external view override returns (uint8, uint256, uint8, uint256) {
        Employee memory emp = employees[employee];
        return (uint8(emp.employeeType), emp.salary, uint8(emp.status), emp.amountPaid);
    }
}
