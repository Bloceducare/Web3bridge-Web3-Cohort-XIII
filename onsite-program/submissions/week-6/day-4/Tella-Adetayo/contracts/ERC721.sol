// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyERC721 is ERC721, Ownable {
    uint256 public nextId = 1;

    constructor() ERC721("MyInLagosCollectible", "MLCL") Ownable(msg.sender) {}

    function mint(address to, uint256 tokenId) external onlyOwner {
        _mint(to, tokenId);
    }
}
