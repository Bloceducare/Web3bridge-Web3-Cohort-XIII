// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Errors.sol";
import "./Interfaces.sol";

contract Ticketing {
    uint256 public eventCount;

    event EventCreated(uint256 indexed eventId, string name, address organizer);
    event TicketPurchased(uint256 indexed eventId, address buyer, uint256 tokenId);

    struct Event {
        string name;
        address organizer;
        uint256 ticketPrice;
        uint256 totalTickets;
        uint256 ticketsSold;
        address tokenAddress;
        address nftAddress;
    }

    mapping(uint256 => Event) public events;

    function createEvent(
        string memory _name,
        uint256 _ticketPrice,
        uint256 _totalTickets,
        address _tokenAddress,
        address _nftAddress
    ) external {
        if (msg.sender == address(0)) revert ZeroAddress();
        if (_ticketPrice == 0 || _totalTickets == 0) revert InvalidAmount();
        if (_tokenAddress == address(0) || _nftAddress == address(0)) revert ZeroAddress();

        uint256 eventId = ++eventCount;

        events[eventId] = Event({
            name: _name,
            organizer: msg.sender,
            ticketPrice: _ticketPrice,
            totalTickets: _totalTickets,
            ticketsSold: 0,
            tokenAddress: _tokenAddress,
            nftAddress: _nftAddress
        });

        emit EventCreated(eventId, _name, msg.sender);
    }

    function buyTicket(uint256 _eventId) external {
        Event storage eventData = events[_eventId];
        if (eventData.organizer == address(0)) revert EventNotFound();
        if (eventData.ticketsSold >= eventData.totalTickets) revert InvalidAmount();

        ITicketToken token = ITicketToken(eventData.tokenAddress);
        if (token.balanceOf(msg.sender) < eventData.ticketPrice) revert InsufficientBalance();

        token.transferFrom(msg.sender, eventData.organizer, eventData.ticketPrice);

        uint256 tokenId = eventData.ticketsSold + 1;
        ITicketNFT(eventData.nftAddress).mint(msg.sender, tokenId);
        eventData.ticketsSold++;

        emit TicketPurchased(_eventId, msg.sender, tokenId);
    }
}