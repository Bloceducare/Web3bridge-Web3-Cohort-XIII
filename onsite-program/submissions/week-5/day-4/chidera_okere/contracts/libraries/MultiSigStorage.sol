//SPDX-License-Identifier: MIT


pragma solidity ^0.8.28;

library MultiSigStorage {
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
    }

    // Custom errors
    error NotOwner();
    error TransactionNotFound();
    error AlreadyConfirmed();
    error TransactionAlreadyExecuted();
    error InsufficientOwners();
    error InvalidRequired();
    error InvalidAddress();
    error OwnerShouldBeUnique();
    error NotConfirmed();
    error TransactionNotExecuted();
    error NotApproved();
}