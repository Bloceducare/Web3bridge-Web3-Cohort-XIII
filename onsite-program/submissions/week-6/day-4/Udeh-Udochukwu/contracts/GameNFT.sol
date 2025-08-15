// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract GameNFT is ERC721 {
    uint256 private tokenId;

    constructor() ERC721("Game NFT", "GNFT") {
        // Mint 100 NFTs to the deployer
        for (uint256 i = 0; i < 100; i++) {
            _mint(msg.sender, tokenId);
            tokenId++;
        }
    }
}