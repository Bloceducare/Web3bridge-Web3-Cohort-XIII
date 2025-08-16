// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IPiggyBank {
    function deposit() external payable;
    function depositERC20(uint256 _amount) external;
    function withdraw() external;
    function withdrawERC20() external;
    function getBalance() external view returns (uint256);
    function getLockExpiry() external view returns (uint64);
    function getOwner() external view returns (address);
    function getTokenAddress() external view returns (address);
    function isLockExpired() external view returns (bool);
} 