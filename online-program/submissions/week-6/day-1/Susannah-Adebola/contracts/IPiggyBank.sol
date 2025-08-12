// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IPiggyBank {
    function getTotalBalances() external view returns (uint256 etherBalance, uint256 tokenBalance);
}
