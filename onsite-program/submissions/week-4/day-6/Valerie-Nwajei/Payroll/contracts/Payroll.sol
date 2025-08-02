// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "../Interfaces/Interface.sol";
contract Payroll is Payment{
    uint256 public CompanyBalance;
    Employee[] public employees;
    address[] public addresses;

    mapping(address=> uint256) public wages;
    mapping(address=>Status) public isEmployed;

    function register(string memory _name, string memory _role, uint256 _wage, Status _status, address _address) public{
        require(_address != address(0), "Invalid address");
        Employee memory _register = Employee(_name, _role, _wage, _status);
        employees.push(_register);
    }

    function payout(address payable _to, uint256 _wage)public returns(bool){
        if(isEmployed[msg.sender] == Status.EMPLOYED){
            if(wages[msg.sender] <= _wage){
            CompanyBalance -= _wage;
            _to.transfer(_wage);
            return true;
            }
        }
        revert("Employee does not exist");
    }
}
