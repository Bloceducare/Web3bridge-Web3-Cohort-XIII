// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPiggyBank {
    function savingsAccountCount() external view returns (uint256);
    function owner() external view returns (address);
}