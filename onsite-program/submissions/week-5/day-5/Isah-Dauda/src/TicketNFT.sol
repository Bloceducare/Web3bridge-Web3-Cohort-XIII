// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract TiketItem is ERC721URIStorage {
    uint256 private _nextTokenId;

    constructor() ERC721("TicketItem", "TNFT") {}

    function awardItem(address player, string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(player, tokenId);
        _setTokenURI(tokenId, tokenURI);

        return tokenId;
    }
}