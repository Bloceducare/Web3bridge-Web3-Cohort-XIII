// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./TicketToken.sol";
import "./TicketNft.sol";

contract EventTicketing {

    TicketToken public ticketToken;
    TicketNft public ticketNft;

    // Event struct for managing events
    struct Event {
        uint256 eventId;
        string name;
        string date;
        string location;
        string description;
        uint256 ticketPrice;
        uint256 totalTickets;
        uint256 soldTickets;
        bool isActive;
    }

    struct TicketDetails {
        address owner;
        uint256 ticket_id;
        string event_name;
        string event_date;
        string event_location;
        string event_description;
        uint256 ticket_price;
    }

    mapping(uint256 => Event) public events;
    mapping(uint256 => TicketDetails) public tickets;
    
    uint256 public eventCount;
    uint256 public ticketCount;


    // Events for logging
    event EventCreated(
        uint256 indexed eventId,
        string name,
        string date,
        string location,
        uint256 ticketPrice,
        uint256 totalTickets
    );
   
   event TicketPurchased(
        uint256 indexed ticketId,
        uint256 indexed eventId,
        address indexed buyer,
        uint256 price
    );

     event TicketCreated(
        uint256 ticket_id,
        address owner,
        string event_name,
        string event_date,
        string event_location,
        string event_description,
        uint256 ticket_price
    );

    
   
    constructor() {
        eventCount = 0;
        ticketCount = 0;
        ticketToken = new TicketToken(1000000 * 10 ** 18);
        ticketNft = new TicketNft();
    }

    function createEvent(
        string memory _name,
        string memory _date,
        string memory _location,
        string memory _description,
        uint256 _ticketPrice,
        uint256 _totalTickets
    ) external  {
        eventCount++;
        
        events[eventCount] = Event({
            eventId: eventCount,
            name: _name,
            date: _date,
            location: _location,
            description: _description,
            ticketPrice: _ticketPrice,
            totalTickets: _totalTickets,
            soldTickets: 0,
            isActive: true
        });
        
        emit EventCreated(
            eventCount,
            _name,
            _date,
            _location,
            _ticketPrice,
            _totalTickets
        );
    }

    

    // BUY TICKET FUNCTION - Users buy tickets for existing events
    function buyTicket(uint256 _eventId) external {
        Event storage eventDetails = events[_eventId];
        
        // Check if event exists and is valid
        require(_eventId > 0 && _eventId <= eventCount, "Event does not exist");
        require(eventDetails.isActive, "Event is not active");
        require(eventDetails.soldTickets < eventDetails.totalTickets, "Event is sold out");
        
        // Check if buyer has enough tokens
        require(ticketToken.balanceOf(msg.sender) >= eventDetails.ticketPrice, "Insufficient token balance");
        
        // Transfer tokens from buyer to this contract
        require(ticketToken.transferFrom(msg.sender, address(this), eventDetails.ticketPrice), "Token payment failed");
        
        // Increment ticket count
        ticketCount++;
        
        
        
        // Update event sold tickets
        eventDetails.soldTickets++;
        
        // Mint NFT ticket to the buyer
        ticketNft.mint(msg.sender, ticketCount);
        
        emit TicketPurchased(ticketCount, _eventId, msg.sender, eventDetails.ticketPrice);
        
        emit TicketCreated(
            ticketCount,
            msg.sender,
            eventDetails.name,
            eventDetails.date,
            eventDetails.location,
            eventDetails.description,
            eventDetails.ticketPrice
        );
    }


}