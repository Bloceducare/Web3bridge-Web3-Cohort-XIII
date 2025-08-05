// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

library ErrorLib {
    error UNAUTHORIZED();
    error ALREADY_INITIALIZED();
    error CAP_EXCEEDED();
    error INSUFFICIENT_BALANCE();
    error INSUFFICIENT_ALLOWANCE();
    error INVALID_ADDRESS();
    error ZERO_AMOUNT();
}
