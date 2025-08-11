// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

library Error {
    error INVALID_AMOUNT();
    error INVALID_TOKEN(); 
    error UNAUTHORIZED_TO_PERFORM_TRANSACTION();
    error INSUFFICIENT_AMOUNT(); 
    error NO_LOCK_SET();
    error USE_WITHDRAW(); 
    error INVALID_TIME(); 
    error UNAUTHORIZED_CALLER(); 
    error NOT_INITIALIZED();
    error PERIOD_MUST_BE_GREATER_THAN_ZERO(); 
    error AGGREGATE_OVERFLOW();
}