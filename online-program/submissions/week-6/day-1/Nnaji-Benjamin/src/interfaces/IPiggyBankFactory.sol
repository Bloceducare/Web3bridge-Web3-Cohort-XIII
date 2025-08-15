// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IPiggyBankFactory {
    function collectPenalty() external payable;
    function collectTokenPenalty(address token, uint256 amount) external;
}
