// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC7432 {
   
    function hasRole(uint256 tokenId, string memory role) external view returns (bool);
}
