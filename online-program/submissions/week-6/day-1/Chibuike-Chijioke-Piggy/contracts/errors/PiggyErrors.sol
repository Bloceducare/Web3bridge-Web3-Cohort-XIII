// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

error UnauthorizedAccess();
error InvalidTokenAddress();
error LockPeriodNotElapsed();
error InsufficientBalance();
error EarlyWithdrawalPenalty(uint256 fee);
error NotVaultOwner();
error ZeroDeposit();