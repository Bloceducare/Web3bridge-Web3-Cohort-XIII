// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IPiggyBank {
    function deposit(uint256 amount) external; 
    function depositETH() external payable; 
    
    function withdraw(uint256 amount) external; 

    function earlyWithdraw(uint256 amount) external; 

    function getBalance() external view returns (uint256);

    function owner() external view returns (address); 
    function token() external view returns (address); 
    function lockedUtils() external view returns (uint256); 
    
    function extendLock(uint256 additionalSeconds) external;  
}