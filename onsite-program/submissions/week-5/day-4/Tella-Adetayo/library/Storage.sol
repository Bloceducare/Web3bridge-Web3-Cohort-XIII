// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

library Storage {
    struct Transaction {
        address to; 
        uint value; 
        bytes data; 
        bool executed; 
    }

    struct Layout {
        address[] owners; 
        mapping(address => bool) isOwner; 
        uint required; 
        Transaction[] transactions; 
        mapping(uint => mapping(address => bool)) approved; 
        address[] allMultiSigAddr;

    }

    bytes32 internal constant STORAGE_SLOT = keccak256("multiSigWallet.storage"); 
    
    function layout() internal pure returns (Layout storage ds) {
        bytes32 slot = STORAGE_SLOT; 
        assembly {
            ds.slot := slot 
        }
    }
}