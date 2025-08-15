// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library Errors {
    error InsufficientFee(uint256 required, uint256 sent);
    error NoRewardsSet();
    error InvalidRewardIndex(uint256 index);
    error TransferFailed();
    error InvalidRandomness();
    error OnlyAdmin();
    error ZeroWeight();
    error InvalidIndex();
}