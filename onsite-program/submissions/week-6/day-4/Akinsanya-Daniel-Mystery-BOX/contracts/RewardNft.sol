// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import  "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";



contract RewardNft is ERC721URIStorage {
    uint256 private _nextTokenId;

    constructor() ERC721("RewardNft", "RNFT") {}

    function mintRewards(address to, string memory tokenURI) public {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
    }
}