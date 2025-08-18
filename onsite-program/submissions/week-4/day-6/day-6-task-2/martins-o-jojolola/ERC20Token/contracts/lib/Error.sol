// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

library Error {
    error InsufficientBalance(uint256 available, uint256 required);
    error Unauthorized(string reason, address caller);
    error Blacklisted(address account);
    error TransferNotAllowed(address from, address to);
    error InvalidAmount(string reason, uint256 amount);
    error AllowanceExceeded(
        address owner,
        address spender,
        uint256 allowed,
        uint256 attempted
    );
    error InvalidInput(string reason);
}
