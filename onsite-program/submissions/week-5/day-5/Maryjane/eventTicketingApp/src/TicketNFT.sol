// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "openzeppelin-contracts/contracts/utils/Counters.sol";
import "openzeppelin-contracts/contracts/utils/Strings.sol";

contract TicketNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct Event {
        string name;
        uint256 date;
        uint256 maxTickets;
        uint256 ticketsSold;
        bool active;
    }

    mapping(uint256 => Event) public events;
    mapping(uint256 => uint256) public tokenEventId;

    constructor() ERC721("EventTicket", "TIX") {}

    function createEvent(string memory name, uint256 date, uint256 maxTickets) external onlyOwner returns (uint256) {
        uint256 eventId = _tokenIdCounter.current();
        events[eventId] = Event(name, date, maxTickets, 0, true);
        _tokenIdCounter.increment();
        return eventId;
    }

    function mintTicket(uint256 eventId) external returns (uint256) {
        Event storage ev = events[eventId];
        require(ev.active, "Event not active");
        require(ev.ticketsSold < ev.maxTickets, "All tickets sold");

        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(msg.sender, tokenId);
        tokenEventId[tokenId] = eventId;

        ev.ticketsSold++;
        _tokenIdCounter.increment();
        return tokenId;
    }

    function burnTicket(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not ticket owner");
        _burn(tokenId);
    }

    /// @notice Link each NFT to a metadata file on IPFS
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        return string(
            abi.encodePacked(
                "https://ipfs.io/ipfs/bafkreigvwzwzcs637kqqnj7lu3zhhvwbjtvzqm3jrtok5phipshuq7svr4/",
                Strings.toString(tokenId),
                ".json"
            )
        );
    }
}
