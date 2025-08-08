// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {TicketNft} from "./TicketNft.sol";
import {TicketToken} from "./TicketToken.sol";

contract EventTicketing {

    error InvalidTicketPrice();
    
    struct TicketDetails {
        string name;
        uint ticketId;
        uint ticketPrice;
        Ticket ticketType;
        Status ticketStatus;
    }

    enum Ticket {
        COMMON,
        RARE,
        VERY_RARE        
    }

    enum Status {
        ONGOING,
        CLOSED
    }

    uint private nextTicketId = 1;

    TicketDetails[] public allTickets;

    mapping (address => TicketDetails) public ticketsByAddress;


    constructor() {

        TicketNft ticketNft = new TicketNft();

        TicketToken ticketToken =  new TicketToken();
    }

    function createTicket(string memory _name, uint _ticketPrice) external Ownable {

        if (_ticketPrice <= 0) revert InvalidTicketPrice();

        TicketDetails memory newTicket = TicketDetails(_nextTicketId, _name, _ticketPrice, _ticketType, Status.ONGOING);
        ticketsByAddress[msg.sender].push(newTicket);
        allTickets.push(newTicket);
        nextTicketId++;
    }

    function getTicketByAddress(address _owner) external view returns(TicketDetails[] memory) [
        return ticketsByAddress[_owner];
    ]

    function getAllTickets() external view returns(TicketDetails[] memory) {
        return allTickets;
    }

    function purchaseTicket(uint _ticketId) external {


    }

    
}

