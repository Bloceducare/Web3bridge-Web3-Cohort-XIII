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

    function registerUser(string memory _name, string memory _role, uint _salary, bool _isEmployed, uint _amountPaid) external; 

    function updateEmploymentStatus(string memory role, uint salary) external;

    function payout(address addr, uint amount) external; 

    function getAllUsers() external; 

    function getUserDetails(address addr) external; 
}