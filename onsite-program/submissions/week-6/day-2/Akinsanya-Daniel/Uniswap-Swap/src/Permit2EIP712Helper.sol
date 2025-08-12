// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract Permit2EIP712Helper {
    bytes32 public constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,uint256 chainId,address verifyingContract)");
    bytes32 public constant NAME_HASH = keccak256(bytes("Permit2"));


    bytes32 public constant PERMIT_SINGLE_TYPEHASH =
        keccak256("PermitSingle(address token,uint160 amount,uint48 expiration,uint48 nonce,address spender,uint256 sigDeadline)");

    function domainSeparator(uint256 chainId, address verifyingContract) public pure returns (bytes32) {
        return keccak256(abi.encode(DOMAIN_TYPEHASH, NAME_HASH, chainId, verifyingContract));
    }

    function hashPermitSingle(
        address token,
        uint160 amount,
        uint48 expiration,
        uint48 nonce,
        address spender,
        uint256 sigDeadline
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(
            PERMIT_SINGLE_TYPEHASH,
            token,
            amount,
            expiration,
            nonce,
            spender,
            sigDeadline
        ));
    }

    function getPermitSingleDigest(
        address token,
        uint160 amount,
        uint48 expiration,
        uint48 nonce,
        address spender,
        uint256 sigDeadline,
        uint256 chainId,
        address verifyingContract
    ) external pure returns (bytes32) {
        bytes32 ds = domainSeparator(chainId, verifyingContract);
        bytes32 structHash = hashPermitSingle(token, amount, expiration, nonce, spender, sigDeadline);
        return keccak256(abi.encodePacked("\x19\x01", ds, structHash));
    }

    
}
