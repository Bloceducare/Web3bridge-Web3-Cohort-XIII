// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface Events {
    event Deposit(address indexed sender, uint amount); 
    event Submit(uint indexed txId); 
    event Approve(address indexed owner, uint indexed txId); 
    event Revoke(address indexed owner, uint indexed txId); 
    event Execute(address indexed txId);
}