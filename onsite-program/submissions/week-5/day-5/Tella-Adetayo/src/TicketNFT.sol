// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract TicketNFT is ERC721URIStorage {
    uint256 private _nextTokenId; 

    constructor() ERC721("Casion", "CSN") {}

    function mintNFT(address _to, string memory _tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++; 
        _mint(_to, tokenId); 
        _setTokenURI(tokenId, _tokenURI); 
        

        return tokenId; 

    }
}
