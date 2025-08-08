// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {TicketNft} from './TicketNft.sol'; // 0x51F8f00bcdDeE9Bfbc9025977ebbBC68AB4Bbc03
 import {TicketToken} from "./TicketToken.sol"; //0xf845369Daad22cC36f85F9dD8D4bFFE028a93EaD

 

// 0x37131dFb1613b36CFF57239ad2AD5778418Be222
contract EventTicketing {
    address organizer;

    TicketNft Ticket_NFT = TicketNft(0xC8dB77CCb5A5bF89c705C6CE1a5d2d28c37854F4);
    TicketToken Ticket_Token = TicketToken(0x5c734eB3aFF7676050B13ff37082318bCCd7035a);

    struct Event {
        address owner;
        string event_name;
        string event_venue;
        uint256 max_ticket;
    }

    mapping(address => uint256) balance;

    enum TICKET_STATUS {
        PENDING,
        ACTIVE,
        EXPIRED
    }

    struct TicketDetails {
        uint256 id;
        uint256 ticket_price;
        string venue;
        TICKET_STATUS status;
    }

    TicketDetails ticketDetails;
    Event eventTicket;

    mapping(address => TicketDetails) ticket;

    constructor(string memory _event_name, string memory _event_venue, uint256 _max_ticket) {
        organizer = msg.sender;
       Event memory _event =  Event(organizer, _event_name, _event_venue, _max_ticket);
        eventTicket = _event;
    }

    function get_event_name() external view returns (string memory) {
      return eventTicket.event_name;
    }

    function set_balance(uint256 _amount) external {
      balance[msg.sender] = _amount;
    }

    function get_balance() external view returns (uint) {
      return balance[msg.sender];
    }


    function get_event_venue() external view returns (string memory) {
      return eventTicket.event_venue;
    }


    function get_max_ticket() external view returns (uint) {
      return eventTicket.max_ticket;
    }

    function create_ticket(uint256 _id, uint256 _price, string memory _venue) external {
        TicketDetails memory ticketDetails_ = TicketDetails(_id, _price, _venue, TICKET_STATUS.PENDING);
       
        ticketDetails = ticketDetails_;

    }

    function get_ticket() external view returns(TicketDetails memory) {
      return ticketDetails;
    }

    function buy_ticket(uint256 _quantity) external {
      require(eventTicket.max_ticket > 0, "Ticket sold out");
       require(Ticket_Token.balanceOf(msg.sender) >= ticketDetails.ticket_price, "You're low on balance");

       Ticket_Token.transfer(0xE2cD6bBad217C1495B023dBa35b40236280Dc356,_quantity * ticketDetails.ticket_price);

        eventTicket.max_ticket -= _quantity;

        Ticket_NFT.buyTicket(msg.sender);

    }

    modifier onlyOwner() {
        require(organizer == msg.sender, "Only an organizer can create an Event");

        _;
    }
}
