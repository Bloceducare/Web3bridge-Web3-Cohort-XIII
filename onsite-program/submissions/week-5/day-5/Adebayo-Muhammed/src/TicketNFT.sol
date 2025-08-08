// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter = 1;
    bool public revealed = false;

    constructor() ERC721("Event Ticket NFT", "TICKET") Ownable(msg.sender) {}

    function mint(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _mint(to, tokenId);
        return tokenId;
    }

    function reveal() external onlyOwner {
        revealed = true;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token doesn't exist");
        
        if (!revealed) {
            return "https://indigo-effective-porpoise-546.mypinata.cloud/ipfs/bafkreiausplr4is6u2quqxddzpm5ihqq2j4ogyq2skk53eyleetzqnfsw4";
        }
        return string(abi.encodePacked("https://indigo-effective-porpoise-546.mypinata.cloud/ipfs/bafkreiausplr4is6u2quqxddzpm5ihqq2j4ogyq2skk53eyleetzqnfsw4", Strings.toString(tokenId), ".json"));
    }

    function totalTickets() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
}