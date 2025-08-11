// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface Events {
    event Deposited(address indexed who, uint256 amount);
    event DepositedETH(address indexed who, uint256 amount);
    event Withdrawn(address indexed who, uint256 amount);
    event EarlyWithdrawn(address indexed who, uint256 amount, uint256 fee);
    event LockExtended(uint256 additionalSeconds, uint256 newLockedUntil);
}