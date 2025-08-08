// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {TicketToken} from "./Ticketing.sol";
import {TicketItem} from "./TicketNft.sol";

contract EventTicket {
    struct Event {
        address owner;
        string name;
        uint256 date;
        uint256 ticketPrice;
        uint256 totalTickets;
        uint256 ticketsSold;
        bool salesOpen;
    }

    TicketItem private ticketItem;

    uint256 private nextEventId;
    mapping(uint256 => Event) public events;
    mapping(address => uint256[]) public buyerTickets; // buyer => list of NFT ticket IDs

    constructor(address ticketItemAddress) {
        ticketItem = TicketItem(ticketItemAddress);
    }

    function createEvent(
        string memory _name,
        uint256 _date,
        uint256 _ticketPrice,
        uint256 _totalTickets
    ) external {
        events[nextEventId] = Event({
            owner: msg.sender,
            name: _name,
            date: _date,
            ticketPrice: _ticketPrice,
            totalTickets: _totalTickets,
            ticketsSold: 0,
            salesOpen: true
        });
        nextEventId++;
    }

    function buyTicket(uint256 eventId, string memory tokenURI) public payable {
        Event storage evt = events[eventId];
        require(evt.salesOpen, "Ticket sales closed");
        require(evt.ticketsSold < evt.totalTickets, "Sold out");
        require(msg.value >= evt.ticketPrice, "Insufficient funds");

        uint256 tokenId = ticketItem.awardItem(msg.sender, tokenURI);
        buyerTickets[msg.sender].push(tokenId);
        evt.ticketsSold++;
    }

    function updateTicketPrice(uint256 eventId, uint256 newPrice) public {
        Event storage evt = events[eventId];
        require(msg.sender == evt.owner, "Not owner");
        evt.ticketPrice = newPrice;
    }

    function ticketsSold(uint256 eventId) public view returns (uint256) {
        return events[eventId].ticketsSold;
    }

    function ticketsRemaining(uint256 eventId) public view returns (uint256) {
        Event storage evt = events[eventId];
        return evt.totalTickets - evt.ticketsSold;
    }

    function closeSales(uint256 eventId) public {
        Event storage evt = events[eventId];
        require(msg.sender == evt.owner, "Not owner");
        evt.salesOpen = false;
    }

    function isSalesOpen(uint256 eventId) public view returns (bool) {
        return events[eventId].salesOpen;
    }
}
