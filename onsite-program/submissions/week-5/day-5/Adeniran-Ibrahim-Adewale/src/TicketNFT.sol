// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

contract TicketNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // Mapping from token ID to ticket ID
    mapping(uint256 => uint256) public ticketIdOf;
    
    // Base URI for token metadata
    string private _baseTokenURI;

    // Mapping from ticket ID to token URI
    mapping(uint256 => string) private _ticketURIs;

    // Event emitted when a new ticket NFT is minted
    event TicketMinted(address indexed to, uint256 tokenId, uint256 ticketId);

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    /**
     * @dev Mints a new ticket NFT for a registrant
     * @param to The address that will own the minted NFT
     * @param ticketId The ID of the ticket being represented by this NFT
     * @return The new token ID
     */
    function mintForRegistrant(address to, uint256 ticketId) external onlyOwner returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        
        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();
        
        _safeMint(to, newTokenId);
        ticketIdOf[newTokenId] = ticketId;
        
        emit TicketMinted(to, newTokenId, ticketId);
        return newTokenId;
    }

    /**
     * @dev Sets the base URI for all tokens
     * @param baseURI The base URI to set
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    /**
     * @dev Sets the URI for a specific ticket ID
     * @param ticketId The ID of the ticket
     * @param tokenURI The URI to set for the ticket
     */
    function setTicketURI(uint256 ticketId, string memory tokenURI) external onlyOwner {
        _ticketURIs[ticketId] = tokenURI;
    }

    /**
     * @dev Returns the base URI for token metadata
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Returns the URI for a given token ID
     * @param tokenId The token ID to query
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireMinted(tokenId);
        
        uint256 ticketId = ticketIdOf[tokenId];
        string memory _ticketURI = _ticketURIs[ticketId];
        
        if (bytes(_ticketURI).length > 0) {
            return _ticketURI;
        }
        
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Returns the total number of tokens minted
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
}
