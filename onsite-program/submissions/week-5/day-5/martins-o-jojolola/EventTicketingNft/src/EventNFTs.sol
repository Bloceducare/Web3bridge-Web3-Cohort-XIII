// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./lib/Counters.sol";

contract EventNFTs is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    struct Ticket {
        uint256 eventId;
        bool used;
        uint256 mintTimestamp;
    }

    mapping(uint256 => Ticket) public tickets; // tokenId => Ticket
    mapping(uint256 => uint256[]) private _eventTickets; // eventId => tokenIds[]
    mapping(address => mapping(uint256 => uint256[])) private _userEventTickets; // user => eventId => tokenIds[]

    event TicketMinted(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        address indexed owner,
        string tokenURI
    );
    event TicketUsed(uint256 indexed tokenId, uint256 indexed eventId);
    event TicketBatchMinted(
        uint256 indexed eventId,
        address[] recipients,
        uint256[] tokenIds
    );

    constructor() ERC721("EventTicket", "ETKT") Ownable(msg.sender) {}

    function mintTicket(
        address to,
        uint256 eventId,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        tickets[tokenId] = Ticket(eventId, false, block.timestamp);
        _eventTickets[eventId].push(tokenId);
        _userEventTickets[to][eventId].push(tokenId);

        emit TicketMinted(tokenId, eventId, to, tokenURI);

        return tokenId;
    }

    function mintBatchTickets(
        address[] calldata recipients,
        uint256 eventId,
        string[] calldata tokenURIs
    ) external onlyOwner {
        require(
            recipients.length == tokenURIs.length,
            "Arrays length mismatch"
        );
        require(recipients.length <= 100, "Batch too large");

        uint256[] memory mintedTokenIds = new uint256[](recipients.length);

        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();

            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);

            tickets[tokenId] = Ticket(eventId, false, block.timestamp);
            _eventTickets[eventId].push(tokenId);
            _userEventTickets[recipients[i]][eventId].push(tokenId);

            mintedTokenIds[i] = tokenId;
        }

        emit TicketBatchMinted(eventId, recipients, mintedTokenIds);
    }

    function useTicket(uint256 tokenId) external onlyOwner {
        require(_exists(tokenId), "Ticket does not exist");
        require(!tickets[tokenId].used, "Ticket already used");

        tickets[tokenId].used = true;
        emit TicketUsed(tokenId, tickets[tokenId].eventId);
    }

    function isTicketValid(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId) && !tickets[tokenId].used;
    }

    function getEventTickets(
        uint256 eventId
    ) public view returns (uint256[] memory) {
        return _eventTickets[eventId];
    }

    function getUserTicketsForEvent(
        address user,
        uint256 eventId
    ) public view returns (uint256[] memory) {
        return _userEventTickets[user][eventId];
    }

    function getTicketInfo(
        uint256 tokenId
    ) public view returns (Ticket memory) {
        require(_exists(tokenId), "Ticket does not exist");
        return tickets[tokenId];
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function getEventForTicket(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "Ticket does not exist");
        return tickets[tokenId].eventId;
    }
}
