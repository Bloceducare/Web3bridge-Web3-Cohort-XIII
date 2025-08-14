// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "../interfaces/ISwapRouter.sol";
import "./swapPermit.sol";


contract EIP712Helper {
        // EIP-712 Domain separator components
        
        string public constant EIP712_DOMAIN_NAME = "Dai Stablecoin";
        string public constant EIP712_DOMAIN_VERSION = "1";
        
        // EIP-712 Type hashes
        bytes32 public constant DOMAIN_TYPEHASH = keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );
        
        bytes32 public constant PERMIT_TYPEHASH = keccak256(
            "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
        );
        
        function buildDomainSeparator(address tokenAddress, uint256 chainId) 
            public 
            pure 
            returns (bytes32) 
        {
            return keccak256(abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes(EIP712_DOMAIN_NAME)),
                keccak256(bytes(EIP712_DOMAIN_VERSION)),
                chainId,
                tokenAddress
            ));
        }
        
        
        function buildPermitHash(
            address owner,
            address spender,
            uint256 value,
            uint256 nonce,
            uint256 deadline
        ) public pure returns (bytes32) {
            return keccak256(abi.encode(
                PERMIT_TYPEHASH,
                owner,
                spender,
                value,
                nonce,
                deadline
            ));
        }
        
        
        function buildEIP712Hash(bytes32 domainSeparator, bytes32 permitHash) 
            public 
            pure 
            returns (bytes32) 
        {
            return keccak256(abi.encodePacked(
                "\x19\x01",
                domainSeparator,
                permitHash
            ));
        }
}