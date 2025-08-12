// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


contract TicketNft is ERC721 {

    address public ticketingContract;

    modifier onlyTicketing() {
        require(msg.sender == ticketingContract, "Only EventTicketing can mint");
        _;
    }

    constructor() ERC721("TicketNft", "TNFT") {

        ticketingContract = _ticketingContract;

    }
    
    function safeMint(address _to, uint _tokenId) external onlyTicketing(){
        _safeMint(_to, _tokenId);
    }

    
}
