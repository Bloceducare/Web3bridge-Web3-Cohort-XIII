// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IPiggyBank
 * @dev Interface for PiggyBank contract.
 */
interface IPiggyBank {
    function deposit(address token, uint256 amount) external payable;
    function withdraw(address token, uint256 amount) external;
    function getBalance(address token) external view returns (uint256);
}