// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TicketNft is ERC721 {

  uint256 private _nextTokenId;
    constructor() ERC721("TicketNft", "TNFT") {
    }

function buyTicket(address _to) external returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(_to, tokenId);
        //_setTokenURI(tokenId, tokenURI);

        return tokenId;
    }
}
