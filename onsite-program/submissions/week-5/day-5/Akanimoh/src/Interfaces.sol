// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ITicketToken {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface ITicketNFT {
    function mint(address to, uint256 tokenId) external;
}