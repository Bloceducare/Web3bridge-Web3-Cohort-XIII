// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../library/Storage.sol";

interface IEmployee {
    function registerUser(string memory _name, Storage.Role _role, uint256 _salary) external; 
    function updateUser(string memory _name, Storage.Role _role, bool _isEmployed, uint256 _salary) external; 
    function getAllUsers() external view returns (Storage.Employee[] memory); 
    function getUser(address _owner) external view returns (Storage.Employee memory); 
}