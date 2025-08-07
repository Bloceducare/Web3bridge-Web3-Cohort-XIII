// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TrinNodeNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenCounter;

    constructor() ERC721("TrinNodeNFT", "TNDNFT") Ownable(msg.sender) {
        _tokenCounter = 0;
    }

    function mintNFT(
        address to,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenCounter;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _tokenCounter++;
        return tokenId;
    }
}
