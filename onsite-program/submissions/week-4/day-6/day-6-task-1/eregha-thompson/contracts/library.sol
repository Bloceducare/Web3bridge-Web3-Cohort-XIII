// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

library Storage {
    error NOT_VALID();
    struct Student{
        string name;
        uint age;
        address owner;
        uint256 UID;
    }
}

  