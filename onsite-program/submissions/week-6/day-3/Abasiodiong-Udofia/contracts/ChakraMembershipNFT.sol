// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ChakraMembershipNFT is ERC721 {
    uint256 private _nextTokenId;

    constructor() ERC721("Chakra Membership NFT", "CHAKRA") {}

    function mint() external {
        uint256 tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);
    }
}