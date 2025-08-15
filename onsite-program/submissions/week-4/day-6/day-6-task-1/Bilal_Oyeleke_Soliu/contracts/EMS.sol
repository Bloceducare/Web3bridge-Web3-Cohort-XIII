// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IEMS.sol";

contract BilalEnterprise is IEMS {
    error EMPLOYEE_ALREADY_EXISTS();
    error EMPLOYEE_NOT_FOUND();
    error EMPLOYEE_NOT_ELIGIBLE();
    error INSUFFICIENT_CONTRACT_BALANCE();

    mapping(address => Employee) private employees;
    Employee[] private employeeArray;

    receive() external payable {}
    fallback() external payable {}

    function registerUser(uint _salary, Role _role) external override {
        address sender = msg.sender;

        // Prevent duplicate registration
        if (employees[sender].userAddress != address(0)) {
            revert EMPLOYEE_ALREADY_EXISTS();
        }

        Employee memory newEmployee = Employee({
            userAddress: sender,
            balance: 0,
            salary: _salary,
            role: _role,
            status: EmploymentStatus.Employed
        });

        employees[sender] = newEmployee;
        employeeArray.push(newEmployee);
    }

    function getBalance(address _address) external view override returns (uint) {
        if (employees[_address].userAddress == address(0)) {
            revert EMPLOYEE_NOT_FOUND();
        }
        return employees[_address].balance;
    }

    function paySalary(address payable _employee_address) external override {
        Employee storage emp = employees[_employee_address];

        if (emp.userAddress == address(0)) {
            revert EMPLOYEE_NOT_FOUND();
        }

        if (emp.status != EmploymentStatus.Employed) {
            revert EMPLOYEE_NOT_ELIGIBLE();
        }

        if (address(this).balance < emp.salary) {
            revert INSUFFICIENT_CONTRACT_BALANCE();
        }

        emp.balance += emp.salary;
        _employee_address.transfer(emp.salary);
    }

    function getEmployees() external view override returns (Employee[] memory) {
        return employeeArray;
    }

    function getAnEmployee(address _userAddress) external view override returns (Employee memory) {
        if (employees[_userAddress].userAddress == address(0)) {
            revert EMPLOYEE_NOT_FOUND();
        }
        return employees[_userAddress];
    }
}
