// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

library Error {
    error INVALID_AMOUNT();
    error UNAUTHORIZED_TO_PERFORM_TRANSACTION(); 
    error INVALID_TOKEN_BALANCE();
    error USE_WITHDRAW();
    error NO_LOCK_SET(); 
    error INSUFFICIENT_BALANCE(); 
    error PERIOD_MUST_BE_GREATER_THAN_ZERO(); 
}