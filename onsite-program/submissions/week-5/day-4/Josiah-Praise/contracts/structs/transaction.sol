// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

struct Transaction {
        uint value;
        uint numberOfConfirmations;
        uint index;
        address to;
        bool exists;
        bool executed;
    }
