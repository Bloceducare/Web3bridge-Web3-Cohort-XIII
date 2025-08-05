// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../interfaces/IEmployee.sol"; 

contract EmployeePayment is IEmployee {
    

    mapping(address => Employee) public employee; 

    Employee[] public allEmployee; 


    function registerUser(string memory _name, string memory _role, bool _isEmployed, uint256 _amountPaid, uint256 _salary) external {
        Employee memory emp = Employee(_name, _role, _isEmployed, _amountPaid, _salary); 
        allEmployee.push(emp); 
        employee[msg.sender] = emp; 
    }

    function updateEmploymentStatus(address _employeeAddress, string memory _role, uint256 salary, bool isEmployed) external {
        Employee storage emp = employee[msg.sender]; 
        emp.role = emp._role; 
        emp.salary = emp._salary; 
        emp.isEmployed = emp._isEmployed; 
        emp.amountPaid = emp._amountPaid; _
    }

    function payout(address addr, uint256 amount) external; 

    function getAllUsers() external; 

    function getUserDetails(address addr) external; 

}