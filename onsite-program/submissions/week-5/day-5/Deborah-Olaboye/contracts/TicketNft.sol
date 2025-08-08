// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TicketNft is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private tokenIdCounter;

    mapping(uint256 => string) private ticketMetadata;
    mapping(address => bool) private authorizedMinters;

    constructor() ERC721("Ticket", "TICKET") {}

    function authorizeMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        authorizedMinters[minter] = true;
    }

    function mintTicket(address to, string memory tokenURI_) external returns (uint256) {
        require(msg.sender == owner() || authorizedMinters[msg.sender], "Not authorized to mint");
        uint256 newTokenId = tokenIdCounter.current();
        tokenIdCounter.increment();

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI_);

        ticketMetadata[newTokenId] = tokenURI_;

        return newTokenId;
    }

    function getTokenURI(uint256 tokenId) public view returns (string memory) {
        return tokenURI(tokenId);
    }
}