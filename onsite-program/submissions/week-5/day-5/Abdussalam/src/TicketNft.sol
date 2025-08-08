// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract TicketNft is ERC721, ERC721URIStorage {
    constructor() ERC721("TicketNft", "TNFT") {}

    function safeMint(address to, uint256 tokenId, string memory uri)
            public
        {
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, "https://coffee-urgent-owl-462.mypinata.cloud/ipfs/bafkreifq4lhld3ttipg3r7c72hbareqqjmw7chws3rblsftuhew3of44rm");
        }

    // ADD THE OVERRIDE FUNCTIONS HERE:
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}





    