// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {TicketNft} from "./TicketNft.sol";
import {TicketToken} from "./TicketToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


contract EventTicketing {

    error InvalidTicketName();
    error InvalidPriceInput();
    error InvalidTicketId();
    error TicketsAreSoldOut();
    error TicketAlreadyPurchased();
    error UserAlreadyOwnsATicket();
    error YouDontHoldAnyTicket();
  
    struct TicketDetails {
        uint ticketId;
        string name;
        uint ticketPrice;
        Status status;
        address owner;
        uint totalTickets;
        uint ticketsSold;
    }

    // enum Ticket {
    //     COMMON,
    //     RARE,
    //     VERY_RARE        
    // }

    enum Status {
        ONGOING,
        SOLD_OUT
    }


    TicketDetails[] public allTickets;

    mapping (address => uint) public ticketsByAddress;

    uint private nextTicketId = 1;
    TicketToken public ticketToken;
    TicketNft public ticketNft;

    event TicketCreated(uint indexed ticketId, string name, uint ticketPrice);
    event TicketPurchased(address indexed buyer, uint indexed ticketId);



    // constructor() {

    //     ticketToken = new TicketToken();
    //     ticketNft = new TicketNft();       
    // }

    function createTicket(string memory _name, uint _ticketPrice, uint _totalTickets) external {

        if (bytes(_name).length <= 0) revert InvalidTicketName();
        if (_ticketPrice <= 0) revert InvalidPriceInput();

        TicketDetails memory newTicket = TicketDetails({
            ticketId: nextTicketId, 
            name: _name, 
            ticketPrice: _ticketPrice, 
            status: Status.ONGOING, 
            owner: address(0), 
            totalTickets: _totalTickets, 
            ticketsSold: 0});

        allTickets.push(newTicket);

        emit TicketCreated(nextTicketId, _name, _ticketPrice);
        nextTicketId++;
    }

    function purchaseTicket(uint _ticketId) external {

        if (_ticketId <= 0 || _ticketId >= nextTicketId) revert InvalidTicketId();
        
        TicketDetails storage ticket = allTickets[_ticketId - 1];
        if (ticket.status == Status.SOLD_OUT) revert TicketsAreSoldOut();
        if (ticket.owner != address(0)) revert TicketAlreadyPurchased();
        if (ticketsByAddress[msg.sender] > 0) revert UserAlreadyOwnsATicket();
        
        // require(ticketToken.transferFrom(msg.sender, ticket.ticketPrice), "Transaction Failed!");
        

        ticketNft.safeMint(msg.sender, _ticketId);

        ticket.owner = msg.sender;
        ticketsByAddress[msg.sender] = _ticketId;
        ticket.ticketsSold++;
        
        if (ticket.ticketsSold >= ticket.totalTickets) ticket.status == Status.SOLD_OUT;
        
        emit TicketPurchased(msg.sender, _ticketId);

    }

    function getTicketByAddress(address _owner) external view returns(TicketDetails memory) {
        uint ticketId = ticketsByAddress[_owner];
        if (ticketId < 0) revert YouDontHoldAnyTicket();
        return allTickets[ticketId - 1];
    }

    function getAllTickets() external view returns(TicketDetails[] memory) {
        return allTickets;
    }

    
}

