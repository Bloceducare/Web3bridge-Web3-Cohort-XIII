// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFTContract is ERC721URIStorage {
    uint256 private _nextTokenId;

    constructor() ERC721("MEDIToken", "MED") {
        awardItem(msg.sender, "ipfs://bafkreidw6tok7mdawb2oqiokzhyxh3oqajtptqkgocxt74dm4swjyxqory");
    }

    function awardItem(address owner, string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(owner, tokenId);
        _setTokenURI(tokenId, tokenURI);

        return tokenId;
    }
}