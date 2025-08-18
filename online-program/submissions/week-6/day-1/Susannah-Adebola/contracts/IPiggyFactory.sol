// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IPiggyFactory {
    function isLockTimeUsed(address user, uint256 lockTime) external view returns (bool);
    function markLockTimeUsed(address user, uint256 lockTime) external;
    function admin() external view returns (address);
}
