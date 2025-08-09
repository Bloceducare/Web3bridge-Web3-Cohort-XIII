// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "./TicketNft.sol";
import "./TicketToken.sol";

contract EventTicketing {
   
   // State variables
    address public owner;
    uint256 public nextEventId;
    
    // References to the NFT and Token contracts
    TicketNft public ticketNft;
    TicketToken public ticketToken;
    
    // Event structure to store event details
    struct Event {
        uint256 eventId;
        string name;
        string description;
        address organizer;
        uint256 ticketPrice;
        uint256 totalTickets;
        uint256 soldTickets;
        bool isActive;
    }
    
    // Ticket structure to store ticket details
    struct Ticket {
        uint256 ticketId;
        uint256 eventId;
        address owner;
        bool isUsed;
    }
    
    // Mappings to store events and tickets
    mapping(uint256 => Event) public events;
    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => uint256) public nextTicketIdForEvent;
    
    // Events (for logging)
    event EventCreated(uint256 indexed eventId, string name, address organizer);
    event TicketCreated(uint256 indexed ticketId, uint256 indexed eventId);
    event TicketPurchased(uint256 indexed ticketId, uint256 indexed eventId, address buyer);
    
    // Constructor
    constructor(address _ticketNFT, address _ticketToken) {
        owner = msg.sender;
        nextEventId = 1;
        ticketNft = TicketNft(_ticketNFT);
        ticketToken = TicketToken(_ticketToken);
    }
    
    // Modifier to check if caller is owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    // Modifier to check if event exists and is active
    modifier eventExists(uint256 _eventId) {
        require(_eventId < nextEventId, "Event does not exist");
        require(events[_eventId].isActive, "Event is not active");
        _;
    }
    
    // Function 1: Create Event
    function createEvent(
        string memory _name,
        string memory _description,
        uint256 _ticketPrice,
        uint256 _totalTickets
    ) external {
        // Create new event
        events[nextEventId] = Event({
            eventId: nextEventId,
            name: _name,
            description: _description,
            organizer: msg.sender,
            ticketPrice: _ticketPrice,
            totalTickets: _totalTickets,
            soldTickets: 0,
            isActive: true
        });
        
        // Initialize ticket counter for this event
        nextTicketIdForEvent[nextEventId] = 1;
        
        // Emit event
        emit EventCreated(nextEventId, _name, msg.sender);
        
        // Increment event ID for next event
        nextEventId++;
    }
    
    // Function 2: Create Tickets (called by event organizer)
    function createTickets(uint256 _eventId, uint256 _numberOfTickets) 
        external 
        eventExists(_eventId) 
    {
        Event storage eventData = events[_eventId];
        
        // Check if caller is the event organizer
        require(msg.sender == eventData.organizer, "Only event organizer can create tickets");
        
        // Check if we don't exceed total tickets
        require(
            nextTicketIdForEvent[_eventId] + _numberOfTickets - 1 <= eventData.totalTickets,
            "Cannot create more tickets than event capacity"
        );
        
        // Create tickets
        for (uint256 i = 0; i < _numberOfTickets; i++) {
            uint256 ticketId = (_eventId * 10000) + nextTicketIdForEvent[_eventId];
            
            tickets[ticketId] = Ticket({
                ticketId: ticketId,
                eventId: _eventId,
                owner: address(0), // No owner initially
                isUsed: false
            });
            
            emit TicketCreated(ticketId, _eventId);
            nextTicketIdForEvent[_eventId]++;
        }
    }
    
    // Function 3: Buy Tickets
    function buyTicket(uint256 _eventId) external eventExists(_eventId) {
        Event storage eventData = events[_eventId];
        
        // Check if tickets are still available
        require(eventData.soldTickets < eventData.totalTickets, "No tickets available");
        
        // Check if buyer has enough tokens
        require(
            ticketToken.balanceOf(msg.sender) >= eventData.ticketPrice,
            "Insufficient token balance"
        );
        
        // Find an available ticket
        uint256 ticketId = 0;
        for (uint256 i = 1; i <= nextTicketIdForEvent[_eventId] - 1; i++) {
            uint256 currentTicketId = (_eventId * 10000) + i;
            if (tickets[currentTicketId].owner == address(0)) {
                ticketId = currentTicketId;
                break;
            }
        }
        
        require(ticketId != 0, "No available tickets found");
        
        // Transfer tokens from buyer to event organizer
        require(
            ticketToken.transferFrom(msg.sender, eventData.organizer, eventData.ticketPrice),
            "Token transfer failed"
        );
        
        // Update ticket ownership
        tickets[ticketId].owner = msg.sender;
        
        // Mint NFT ticket to buyer
        ticketNft.mint(msg.sender, ticketId);
        
        // Update sold tickets count
        eventData.soldTickets++;
        
        // Emit event
        emit TicketPurchased(ticketId, _eventId, msg.sender);
    }
    
    // Helper function to get event details
    function getEvent(uint256 _eventId) external view returns (Event memory) {
        require(_eventId < nextEventId, "Event does not exist");
        return events[_eventId];
    }
    
    // Helper function to get ticket details
    function getTicket(uint256 _ticketId) external view returns (Ticket memory) {
        return tickets[_ticketId];
    }
    
    // Helper function to check available tickets for an event
    function getAvailableTickets(uint256 _eventId) external view returns (uint256) {
        require(_eventId < nextEventId, "Event does not exist");
        return events[_eventId].totalTickets - events[_eventId].soldTickets;
    }
}

