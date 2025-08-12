// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";

contract Permit2Helper is Script {

    string constant PERMIT_TRANSFER_FROM_TYPEHASH = 
        "PermitTransferFrom(TokenPermissions permitted,address spender,uint256 nonce,uint256 deadline)";
    
    string constant TOKEN_PERMISSIONS_TYPEHASH = 
        "TokenPermissions(address token,uint256 amount)";
    
    bytes32 constant PERMIT2_DOMAIN_SEPARATOR = 
        0x0000000000000000000000000000000000000000000000000000000000000000;
    
    struct TokenPermissions {
        address token;
        uint256 amount;
    }
    
    struct PermitTransferFrom {
        TokenPermissions permitted;
        uint256 nonce;
        uint256 deadline;
    }
    

    function getPermit2Hash(
        address token,
        uint256 amount,
        address spender,
        uint256 nonce,
        uint256 deadline
    ) public pure returns (bytes32) {
        TokenPermissions memory permitted = TokenPermissions({
            token: token,
            amount: amount
        });
        
        PermitTransferFrom memory permit = PermitTransferFrom({
            permitted: permitted,
            nonce: nonce,
            deadline: deadline
        });
        
        bytes32 structHash = keccak256(abi.encode(
            keccak256(bytes(PERMIT_TRANSFER_FROM_TYPEHASH)),
            keccak256(abi.encode(
                keccak256(bytes(TOKEN_PERMISSIONS_TYPEHASH)),
                permitted.token,
                permitted.amount
            )),
            spender,
            permit.nonce,
            permit.deadline
        ));
        
        return keccak256(abi.encodePacked(
            "\x19\x01",
            PERMIT2_DOMAIN_SEPARATOR,
            structHash
        ));
    }
    
    function demonstrateUsage() external pure {
       
    }
}