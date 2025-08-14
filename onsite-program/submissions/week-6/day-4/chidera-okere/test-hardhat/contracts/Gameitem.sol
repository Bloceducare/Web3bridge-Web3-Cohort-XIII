// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract GameItem is ERC1155 {
    constructor() ERC1155("https://game.example/api/item/{id}.json") {
        // Mint 1000 items with ID 1 to deployer
        _mint(msg.sender, 1, 1000, "");
    }
}