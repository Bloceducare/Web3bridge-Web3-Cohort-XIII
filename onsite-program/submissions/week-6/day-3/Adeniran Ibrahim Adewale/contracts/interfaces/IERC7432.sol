// contracts/interfaces/IERC7432.sol  
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC7432 {
    function ownerOf(address tokenAddress, uint256 tokenId) external view returns (address owner_);
}