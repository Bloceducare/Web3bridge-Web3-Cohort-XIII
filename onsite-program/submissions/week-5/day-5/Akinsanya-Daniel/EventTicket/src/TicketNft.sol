// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import  "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";



contract TicketNft is ERC721URIStorage {
    uint256 private _nextTokenId;

    constructor() ERC721("TicketNft", "TNFT") {}

    function mintTicket(address to, string memory tokenURI) public {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI); 
    }
}