// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

library Storage {
    struct Layout {
        mapping(address => uint)  balanceOf; 
        mapping(address => mapping(address => uint)) allowance;  
        address[] tokens; 
    }

    bytes32 internal constant STORAGE_SLOT = keccak256("erc20.storage"); 

    function layout() internal pure returns (Layout storage ds) {
        bytes32 slot = STORAGE_SLOT; 
        assembly {
            ds.slot := slot
        }
    }
}