// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GovernanceNFT is ERC721, Ownable {
    uint256 public nextId = 1;

    constructor() ERC721("DAO Governance NFT", "DAONFT") Ownable(msg.sender) {}

    function mint(address to) external onlyOwner returns (uint256 tokenId) {
        tokenId = nextId++;
        _safeMint(to, tokenId);
    }
}
