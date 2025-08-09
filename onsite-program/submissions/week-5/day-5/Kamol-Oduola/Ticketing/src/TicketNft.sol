// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract TicketNft is ERC721URIStorage {
    constructor() ERC721("Event Ticket", "ETKT") {}

    function mintTicketNft(address to, uint256 tokenId, string memory tokenURI) external {
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
    }
}
