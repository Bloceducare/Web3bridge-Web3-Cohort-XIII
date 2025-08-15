// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BoxNFT is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;

    constructor(address initialOwner) 
        ERC721("BoxNFT", "BNFT") 
        Ownable(initialOwner) 
    {}

    function mintBoxNFT(address to, string memory tokenURI) public onlyOwner {
        _safeMint(to, nextTokenId);
        _setTokenURI(nextTokenId, tokenURI);
        nextTokenId++;
    }
}