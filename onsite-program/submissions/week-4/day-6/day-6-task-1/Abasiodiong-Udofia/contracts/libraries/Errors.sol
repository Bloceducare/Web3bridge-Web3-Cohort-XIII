// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library Errors {
    error InvalidAddress();
    error UserNotFound(uint256 id);
    error InvalidSalaryAmount();
    error UserNotEmployed(uint256 id);
    error InsufficientBalance(uint256 required, uint256 available);
    error NameCannotBeEmpty();
    error SalaryExceedsAgreedAmount(uint256 requested, uint256 agreed);
}