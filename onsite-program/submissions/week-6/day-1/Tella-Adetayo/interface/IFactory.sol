// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IFactory {
    function createSavings(address token, uint256 lockPeriodSeconds) external returns (address child); 

    function getAccounts(address user) external view returns (address[] memory); 
    function getAccountCount(address user) external view returns (uint256); 
    
    function adminWithdrawFees(address token) external; 

    function updateAggregateOnDeposit(address user, uint256 amount) external; 
    function updateAggreageOnWithDraw(address user, uint256 amount) external;

    function admin() external view returns (address); 
}