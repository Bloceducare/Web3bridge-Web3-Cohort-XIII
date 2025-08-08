// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
// import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TicketNft is ERC721URIStorage {
    uint256 tokenId = 0;

     struct TicketDetails{
       string eventName;
       string eventLocation;
       uint256 ticketPrice;
    }

    mapping(uint256=>TicketDetails) ticketInfo;

    constructor() ERC721("TicketNft", "TNFT") {}

    // Mapping from tokenId to token URI
    mapping(uint256 => string) private _tokenURIs;

    function mint(address _buyer) external returns(uint256) {
        tokenId++;
        _mint(_buyer, tokenId);
        _setTokenURI(tokenId, "https://blush-rapid-tern-82.mypinata.cloud/ipfs/bafkreif3pxldne4s6uezgux6e55sa3xvzfrq2aygyfrqdu7x43vo74ov54");
        return tokenId;
    }

    
}
