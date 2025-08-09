// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {TicketNft} from "./TicketNft.sol";
import {TicketToken} from "./TicketToken.sol";

contract EventTicketing {

    error InvalidTicketName();
    error InvalidPriceInput();
    error InvalidTicketId();
    error TicketsAreSoldOut();
    error TicketAlreadyPurchased();
    error PermissionNotGranted();
  
    struct TicketDetails {
        uint ticketId;
        string name;
        uint ticketPrice;
        Ticket ticketType;
        Status ticketStatus;
        address owner;
        uint totalTickets;
        uint ticketsSold;
    }

    enum Ticket {
        COMMON,
        RARE,
        VERY_RARE        
    }

    enum Status {
        ONGOING,
        SOLD_OUT
    }


    TicketDetails[] public allTickets;

    mapping (address => uint) public ticketsByAddress;

    uint private nextTicketId = 1;
    IERC20 public ticketToken;
    IERC721 public ticketNft;

    event TicketCreated(uint indexed ticketId, string name, uint ticketPrice, TicketType ticketType);
    event TicketPurchased(address indexed buyer, uint indexed ticketId);



    constructor() {

        TicketToken ticketToken =  new TicketToken();
        TicketNft ticketNft = new TicketNft();
    }

    function createTicket(string memory _name, uint _ticketPrice, uint _totalTickets) external {

        if (bytes(_name).length <= 0) revert InvalidTicketName();
        if (_ticketPrice <= 0) revert InvalidPriceInput();

        TicketDetails memory newTicket = TicketDetails(nextTicketId, _name, _ticketPrice, _ticketType, Status.ONGOING, owner=msg.sender);
        allTickets.push(newTicket);

        emit TicketCreated(nextTicketId, _name, _ticketPrice, _ticketType);
        nextTicketId++;
    }

    function purchaseTicket(uint _ticketId) external {

        if (_ticketId <= 0 && _ticketId >= nextTicketId) revert InvalidTicketId();
        
        TicketDetails storage ticket = allTickets[_ticketId - 1];
        if (ticket.ticketStatus == Status.SOLD_OUT) revert TicketsAreSoldOut();
        if (ticket.owner <= address(0)) revert TicketAlreadyPurchased();

        ticketNft.mint(msg.sender, _ticketId);

        ticket.owner = msg.sender;
        ticketsByAddress[msg.sender] = _ticketId;

        emit TicketPurchased(msg.sender, ticketId);

    }

    function getTicketByAddress(address _owner) external view OnlyOwner returns(TicketDetails[] memory) {
        if (_ticketId < 0) revert PermissionNotGranted();
        return ticketsByAddress[_owner];
    }

    function getAllTickets() external view returns(TicketDetails[] memory) {
        return allTickets;
    }

    
}

