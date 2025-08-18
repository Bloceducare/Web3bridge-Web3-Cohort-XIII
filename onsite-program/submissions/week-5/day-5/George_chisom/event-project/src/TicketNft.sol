// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";


contract EventTicketNft is ERC721 {
    
    uint256 private _nextTokenId;

    constructor() ERC721("EventTicketNFT", "ETNFT") {
        _nextTokenId = 1;
    }

    function mint(address to, uint256 tokenId) external {
        _safeMint(to, tokenId);
        _nextTokenId++;
    }
}