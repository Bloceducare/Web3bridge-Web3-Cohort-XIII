// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RegisterNFT is ERC721URIStorage, Ownable {
    uint256 public tokenId;

    constructor(string memory name_, string memory symbol_, address initialOwner) ERC721(name_, symbol_) Ownable(initialOwner) {}

    function mintWorkerNFT(address to, string memory tokenURI) public onlyOwner returns (uint256) {
        uint256 currentId = tokenId;
        _safeMint(to, currentId);
        _setTokenURI(currentId, tokenURI);
        tokenId++;
        return currentId;
    }

    function mintContributorNFT(address to, string memory tokenURI) public onlyOwner returns (uint256) {
        uint256 currentId = tokenId;
        _safeMint(to, currentId);
        _setTokenURI(currentId, tokenURI);
        tokenId++;
        return currentId;
    }
}
