// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Minimal ERC20 Interface
/// @notice Just enough to interact with tokens in PiggyBank
interface IPeggyIERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}
