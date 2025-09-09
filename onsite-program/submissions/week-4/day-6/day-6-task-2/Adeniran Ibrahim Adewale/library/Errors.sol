// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.25;

library Errors {
    error Unauthorized();
    error InvalidInput();
    error InsufficientBalance();
    error OperationFailed();
    error NotFound();
    error AlreadyExists();
    error AccessDenied();
    error InvalidState();
    error Timeout();
    error RateLimitExceeded();
    error NotAllow();
    error InvalidAddress();
}