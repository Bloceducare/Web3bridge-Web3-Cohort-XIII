// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library Errors {
    error NotOwner();
    error NotETHMode();
    error NotERC20Mode();
    error ZeroDeposit();
    error ZeroWithdraw();
    error InsufficientBalance();
    error TransferFailed();
    error RescueNotAdmin();
    error InvalidAddress();
    error InvalidPlan();
    error InvalidLockPeriod();
    error DirectETHNotAllowed();
}
