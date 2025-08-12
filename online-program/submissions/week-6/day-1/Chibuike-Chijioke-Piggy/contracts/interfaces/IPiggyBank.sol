// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IPiggyBank {
    function deposit(uint256 amount) external payable;
    function withdraw() external;
    function getPiggyVaultBalance() external view returns (uint256);
    function getLockEnd() external view returns (uint256);
}