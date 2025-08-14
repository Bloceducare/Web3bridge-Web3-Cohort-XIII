//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC1155 {
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
}

interface IERC721 {
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}