// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library StakeLib {
    function getUnlockTime(uint256 lockPeriod) internal view returns (uint256) {
        return block.timestamp + lockPeriod;
    }
}
