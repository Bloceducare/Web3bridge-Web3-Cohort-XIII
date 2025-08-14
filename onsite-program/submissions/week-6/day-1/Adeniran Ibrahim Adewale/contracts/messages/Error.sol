// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

library Error {
    error NOTHING_TO_WITHDRAW();
    error WITHDRAWER_FAILED();
    error ETH_TOO_LOW();
    error ENTER_CORRECT_AMOUNT();
    error ALREADY_WITHDRAWN_OR_NOT_EXIST();
}