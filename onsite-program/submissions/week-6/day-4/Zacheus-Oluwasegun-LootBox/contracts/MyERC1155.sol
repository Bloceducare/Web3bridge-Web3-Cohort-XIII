// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardERC1155 is ERC1155, Ownable {
    uint256 public constant TOKEN_ID = 1;
    uint256 public constant TOTAL_SUPPLY = 10_000; // Pre-minted supply for token ID 1

    constructor() ERC1155("https://example.com/api/item/{id}.json") Ownable(msg.sender) {
        _mint(address(this), TOKEN_ID, TOTAL_SUPPLY, "");
    }

    function transferToWinner(address to, uint256 id, uint256 amount, bytes memory data) external onlyOwner {
        require(balanceOf(address(this), id) >= amount, "Insufficient contract balance");
        _safeTransferFrom(address(this), to, id, amount, data);
    }
}