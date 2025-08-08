// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract EventTicketing {
    ERC20 public ticketToken;
    address public owner;
    uint256 private ticketCounter;

    struct Event {
        uint256 eventId;
        string name;
        uint256 totalTickets;
        uint256 ticketsSold;
        uint256 ticketPrice;
        bool isActive;
    }

    struct Ticket {
        uint256 ticketId;
        uint256 eventId;
        address owner;
        bool isUsed;
    }

    mapping(uint256 => Event) public events;
    mapping(uint256 => Ticket) public tickets;
    uint256 public eventCount;

    event EventCreated(uint256 indexed eventId, string name, uint256 totalTickets, uint256 ticketPrice);
    event TicketPurchased(uint256 indexed ticketId, uint256 indexed eventId, address buyer);
    event TicketUsed(uint256 indexed ticketId, uint256 indexed eventId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(address _ticketToken) {
        ticketToken = ERC20(_ticketToken);
        owner = msg.sender;
        ticketCounter = 0;
    }

    function createEvent(
        string memory name,
        uint256 totalTickets,
        uint256 ticketPrice
    ) external onlyOwner {
        require(totalTickets > 0, "Total tickets must be greater than 0");
        require(ticketPrice > 0, "Ticket price must be greater than 0");

        eventCount++;
        events[eventCount] = Event({
            eventId: eventCount,
            name: name,
            totalTickets: totalTickets,
            ticketsSold: 0,
            ticketPrice: ticketPrice,
            isActive: true
        });

        emit EventCreated(eventCount, name, totalTickets, ticketPrice);
    }

    function buyTicket(uint256 eventId) external {
        Event storage event_ = events[eventId];
        require(event_.isActive, "Event is not active");
        require(event_.ticketsSold < event_.totalTickets, "No tickets available");
        require(ticketToken.balanceOf(msg.sender) >= event_.ticketPrice, "Insufficient token balance");
        require(ticketToken.allowance(msg.sender, address(this)) >= event_.ticketPrice, "Insufficient allowance");

        ticketCounter++;
        uint256 newTicketId = ticketCounter;

        tickets[newTicketId] = Ticket({
            ticketId: newTicketId,
            eventId: eventId,
            owner: msg.sender,
            isUsed: false
        });

        event_.ticketsSold++;
        ticketToken.transferFrom(msg.sender, owner, event_.ticketPrice);

        emit TicketPurchased(newTicketId, eventId, msg.sender);
    }

    function useTicket(uint256 ticketId) external {
        Ticket storage ticket = tickets[ticketId];
        require(ticket.owner == msg.sender, "Not ticket owner");
        require(!ticket.isUsed, "Ticket already used");
        require(events[ticket.eventId].isActive, "Event is not active");

        ticket.isUsed = true;

        emit TicketUsed(ticketId, ticket.eventId);
    }

    function toggleEventActive(uint256 eventId) external onlyOwner {
        require(eventId <= eventCount, "Event does not exist");
        events[eventId].isActive = !events[eventId].isActive;
    }
}