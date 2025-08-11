// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IPiggyBank {

    struct SavingsPlan {
        uint256 balance;
        uint256 lockPeriod;
        uint256 startTime;
        bool isEther;
        address token;
    }
    
    event Deposited(address indexed user, uint256 amount, bool isEther, address token, uint256 lockPeriod);
    event Withdrawn(address indexed user, uint256 amount, bool isEther, address token, uint256 penalty);
    event SavingsPlanCreated(uint256 indexed planId, uint256 lockPeriod, bool isEther, address token);

    function depositEther(uint256 lockPeriod) external payable;
    function depositToken(address token, uint256 amount, uint256 lockPeriod) external;
    function withdraw(uint256 planId) external;
    function getBalance(uint256 planId) external view returns (uint256);
    function getSavingsPlan(uint256 planId) external view returns (SavingsPlan memory);
}