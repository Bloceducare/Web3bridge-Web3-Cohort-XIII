// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";


contract MyNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    constructor(address initialOwner) ERC721("My Picture NFT", "MPNFT") Ownable(initialOwner) {}

    function mintNFT(address to, string memory tokenURI) public onlyOwner {
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _tokenIdCounter += 1;
    }
}
// 0xC96e4e9738011E88c0E6A27753B7f6CaEc4913D1 
// https://sepolia-blockscout.lisk.com/token/0xC96e4e9738011E88c0E6A27753B7f6CaEc4913D1
// 0x0001bb4B3DA2397e30afD222f8D22a5cd7aD3F0e
// https://sepolia-blockscout.lisk.com/token/0x0001bb4B3DA2397e30afD222f8D22a5cd7aD3F0e