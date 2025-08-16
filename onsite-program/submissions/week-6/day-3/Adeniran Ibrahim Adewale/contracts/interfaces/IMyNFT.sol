// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMyNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function safeMint(address to, uint256 tokenId) external;
    function tokenURI(uint256 tokenId) external view returns (string memory);
}
