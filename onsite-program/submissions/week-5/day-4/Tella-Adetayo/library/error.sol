// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

library Error {
    error OWNER_REQUIRED(); 
    error INVALID_NUMBER_OF_OWNERS();
    error INVALID_OWNER();
    error OWNER_NOT_UNIQUE();
    error APPROVAL_LESS_THAN_REQUIRED();
    error TX_FAILED();
    error TX_NOT_APPROVED();
}