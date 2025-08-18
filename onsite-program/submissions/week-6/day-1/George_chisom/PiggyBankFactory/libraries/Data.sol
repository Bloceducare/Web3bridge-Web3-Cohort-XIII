// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

library PiggyBankData {

    
    struct SavingsAccount {
        address token;
        uint256 lockPeriod;
        uint256 lockEnd;
        uint256 balance;
        string userName;
    }

    
    error ArrayLengthMismatch();

    error NoAccountsProvided();

    error InvalidLockPeriod();

    error DuplicateLockPeriod();

    error InvalidAccountId();

    error ZeroDeposit();

    error AmountMismatch();

    error ERC20TransferFailed();

    error ZeroAmount();

    error InsufficientBalance();

    error TransferFailed();



    event AccountsCreated(address indexed user, address[] tokens, uint256[] lockPeriods, string[] userNames);

    event Deposited(address indexed user, uint256 accountId, uint256 amount, address token);

    event Withdrawn(address indexed user, uint256 accountId, uint256 amount, uint256 fee, address token);
}