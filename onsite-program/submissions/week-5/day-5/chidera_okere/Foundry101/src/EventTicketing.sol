// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {TicketToken} from "../src/TicketToken.sol";
import {TicketNft} from "../src/TicketNft.sol";


interface IMintableNFT {
    function mint(address to, uint256 tokenId) external;
}

contract EventTicketing {

    enum Status {
        EXPIRED,
        ACTIVE
    }

    struct TicketDetails {
        uint256 ticket_price;
        uint256 ticket_quantity;
        string event_name;
        string event_date;
        string event_location;
        string event_description;
        Status status;
        address organizer;  
    }

    // State variables
    TicketDetails[] ticketsList;
    mapping(address => uint256[]) public userTickets;  
    mapping(uint256 => address[]) public eventAttendees;  
    uint256 public ticketCount;
    uint256 private nftTokenIdCounter; 

    TicketToken public ticketToken;
    TicketNft public ticketNft;


    constructor(address _ticketToken, address _ticketNft) {
        ticketToken = TicketToken(_ticketToken);
        ticketNft = TicketNft(_ticketNft);
        ticketNft.transferOwnership(address(this)); // Set the contract deployer as the owner of the NFT contract
        nftTokenIdCounter = 1;  
    }

    function createTicket(
        uint256 _ticket_price,
        uint256 _ticket_quantity,
        string memory _event_name,
        string memory _event_date,
        string memory _event_location,
        string memory _event_description
    ) public {
        TicketDetails memory newTicket = TicketDetails({
            ticket_price: _ticket_price,
            ticket_quantity: _ticket_quantity,
            event_name: _event_name,
            event_date: _event_date,
            event_location: _event_location,
            event_description: _event_description,
            status: Status.ACTIVE,  
            organizer: msg.sender   
        });

        ticketsList.push(newTicket);
    
        ticketCount++;
    }

    function getTicketDetails(uint256 _ticketId) public view returns (TicketDetails memory) {
        require(_ticketId < ticketCount, "Ticket does not exist");
        return ticketsList[_ticketId];
    }

    function buyTicket(uint256 _eventId) external {
        require(_eventId < ticketCount, "Event does not exist");
        
        TicketDetails storage eventTicket = ticketsList[_eventId];  

        require(ticketToken.balanceOf(msg.sender) >= eventTicket.ticket_price, "Insufficient balance");
        require(eventTicket.ticket_quantity > 0, "Ticket sold out");
        require(eventTicket.status == Status.ACTIVE, "Event is not active");

        
        ticketToken.transferFrom(msg.sender, eventTicket.organizer, eventTicket.ticket_price);
        
    
        uint256 nftId = nftTokenIdCounter ++;
        ticketNft.mint(msg.sender, nftId);
        nftTokenIdCounter++;

        
        eventTicket.ticket_quantity -= 1;
        userTickets[msg.sender].push(_eventId);
        eventAttendees[_eventId].push(msg.sender);
    }

    
    function getUserTickets(address user) external view returns (uint256[] memory) {
        return userTickets[user];
    }

    
    function getEventAttendees(uint256 eventId) external view returns (address[] memory) {
        return eventAttendees[eventId];
    }
}