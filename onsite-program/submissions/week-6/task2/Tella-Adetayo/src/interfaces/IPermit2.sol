// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./IERC20.sol"; 

interface IPermit2 {
    struct TokenPermissions {
        IERC20 token; 
        uint256 amount; 
    }

    struct PermitTransferFrom {
        TokenPermissions permitted; 
        uint256 nonce; 
        uint256 deadline; 
    }

    struct PermitBatchTransferFrom {
        TokenPermissions[] permitted; 
        uint256 nonce; 
        uint256 deadline; 
    }

    struct SignatureTransferDetails {
        address to;
        uint256 requestedAmount; 
    }

    function permitTransferFrom(
        PermitTransferFrom calldata permit, 
        SignatureTransferDetails calldata transferDetails, 
        address owner, 
        bytes calldata signature 
    ) external; 

    function permitTransferFrom(
        PermitBatchTransferFrom calldata permit, 
        SignatureTransferDetails[] calldata transferDetails, 
        address owner, 
        bytes calldata signature 
    ) external; 
}