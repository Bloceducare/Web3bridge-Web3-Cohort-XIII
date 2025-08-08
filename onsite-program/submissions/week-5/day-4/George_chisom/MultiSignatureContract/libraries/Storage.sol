// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

library Storage {

    struct MultiSignatureAccount {
        address acctAddress;
        uint value;
        bytes acctData;
        string acctDescription;
        bool executed;
    }

    event Deposited (address indexed sender, uint amount);
    event Submitted (uint indexed transID);
    event Approve (address indexed owner, uint indexed transID);
    event Revoke (address indexed owner, uint indexed transID);
    event Execute (uint indexed transID);

    error Stop();
    error Reverted();
    error Owners_Required();
    error Invalid_Number_of_Owners();
    error Invalid_Owner();
}

