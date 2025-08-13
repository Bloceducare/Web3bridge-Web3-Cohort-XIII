// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IPiggyBank {
    event Deposited(address indexed depositor, uint256 amount);
    event Withdrawn(address indexed owner, uint256 amount, uint256 fee);

    function deposit(uint256 amount) external payable;
    function withdraw(uint256 amount) external;
    function getBalance() external view returns (uint256);
    function owner() external view returns (address);
    function admin() external view returns (address);
    function unlockTime() external view returns (uint256);
    function asset() external view returns (address);
}