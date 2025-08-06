//SPDX-Lincense-Identifier: MIT


pragma solidity ^0.8.28;

library Error {
    error NOT_ADMIN();
    error NOT_AUTHORISED();
    error INVALID_NAME();
    error EMPLOYEE_NOT_FOUND();
    error INSUFFICIENT_BALANCE();
    error TRANSFER_FAILED();
}