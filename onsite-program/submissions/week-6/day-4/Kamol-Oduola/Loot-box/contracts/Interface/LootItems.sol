// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LootItems is ERC1155, Ownable {
    constructor() ERC1155("https://game.example/api/item/{id}.json") Ownable(msg.sender) {
        _mint(msg.sender, 1, 100, ""); //
        _mint(msg.sender, 2, 50, "");  
    }
}
