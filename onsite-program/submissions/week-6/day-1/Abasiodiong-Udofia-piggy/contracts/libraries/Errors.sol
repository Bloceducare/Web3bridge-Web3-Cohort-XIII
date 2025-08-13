// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library Errors {
    error ZeroAmount();
    error IncorrectEtherValue(uint256 expected, uint256 sent);
    error EtherSentForERC20();
    error OnlyOwner(address caller);
    error InsufficientBalance(uint256 requested, uint256 available);
    error ZeroDuration();
}