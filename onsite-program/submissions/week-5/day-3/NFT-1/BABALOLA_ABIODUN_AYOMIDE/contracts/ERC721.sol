// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AbbeyNft is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    constructor() Ownable(msg.sender) ERC721("RAFIK", "RAFIK_NFT") {}

    function mintNFT(address recipient, string memory tokenURI) public onlyOwner returns (uint256) {
        _tokenIdCounter++;
        uint256 newItemId = _tokenIdCounter;
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);
        return newItemId;
    }
}