// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IPiggyBank {
    function getBalance() external view returns (uint256);
    function tokenAddress() external view returns (address);
    function lockPeriod() external view returns (uint256);
    function deposit(uint256 _amount) external payable;
    function withdraw() external;
}
