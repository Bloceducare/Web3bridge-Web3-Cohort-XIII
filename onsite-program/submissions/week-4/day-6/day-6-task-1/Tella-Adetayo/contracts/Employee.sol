// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../interfaces/IEmployee.sol"; 

contract EmployeePayment is IEmployee {
    

    mapping(address => Employee) public employee; 

    Employee[] public allEmployee; 


    function registerUser(string memory _name, string memory _role, uint _salary, bool _isEmployed, uint _amountPaid) external {
        Employee memory emp = Employee(_name, _role, _salary, _isEmployed, _amountPaid); 
        allEmployee.push(emp); 
        employee[msg.sender].push(emp); 
    }

    function updateEmploymentStatus(uint256 _index, string memory _name, string memory _role, uint256 _salary, bool _isEmployed, uint256 _amountPaid) external {
        Employee storage emp = employee[msg.sender];
        emp.name = emp._name; 
        emp.role = emp._role; 
        emp.salary = emp._salary; 
        emp.isEmployed = emp._isEmployed; 
        emp.amountPaid = emp._amountPaid; 
    }

    function payout(address addr, uint256 amount) external; 

    function getAllUsers() external; 

    function getUserDetails(address addr) external; 

}