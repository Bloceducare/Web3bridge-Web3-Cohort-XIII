// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface Payment {
    struct Employee{
        string name;
        string role;
        uint256 wage;
        Status status;
    }

    enum Status{
        EMPLOYED,
        PROBATION, 
        TERMINATED
    }

    function register(string memory _name, string memory _role, uint256 _wage, Status _status, address _address) external;
    function payout(address payable _to, uint256 _wage)external returns(bool);

}