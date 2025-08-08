// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketNft is ERC721, Ownable {
    uint256 public tokenIdCounter;

    constructor(address initialOwner) ERC721("EventTicket", "ETKT") Ownable(initialOwner) {}

    function mint(address to, uint256 tokenId) external onlyOwner {
        _safeMint(to, tokenId);
    }
}
