// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardERC721 is ERC721, Ownable {
    uint256 private _tokenId;

    constructor() ERC721("RewardNFT", "RNFT") Ownable(msg.sender) {
        _tokenId = 0;
    }

    function safeMint(address to) external onlyOwner {
        _tokenId++;        
        _safeMint(to, _tokenId);
    }
}