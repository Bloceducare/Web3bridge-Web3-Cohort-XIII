// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { TicketNft } from "./TicketNft.sol";
import { TicketToken } from "./TicketToken.sol";

error Sold_Out();
error Payment_Failed();
error Need_Ticket();
error Insufficient_Balance();
error Invalid_Address();
error Insufficient_Allowance();
error Event_Not_Found();
error Not_Event_Creator();
error Cannot_Update_Sold_Out();

contract EventTicketing {
    struct Event {
        uint256 id;
        address creator;
        string name;
        string location;
        uint256 price;
        uint256 totalTickets;
        uint256 ticketsSold;
    }

    mapping(uint256 => Event) public events;
    uint256 public nextEventId;

    IERC20 public paymentToken;
    TicketNft public ticketNFT;

    constructor(address _paymentToken, address _ticketNFT) {
        paymentToken = IERC20(_paymentToken);
        ticketNFT = TicketNft(_ticketNFT);
    }

    function createEvent(
        string memory _name,
        string memory _location,
        uint256 _price,
        uint256 _totalTickets
    ) external {
        if(_totalTickets <= 0) revert Need_Ticket();
        if(msg.sender == address(0)) revert Invalid_Address();

        events[nextEventId] = Event({
            id: nextEventId,
            creator: msg.sender,
            name: _name,
            location: _location,
            price: _price,
            totalTickets: _totalTickets,
            ticketsSold: 0
        });

        nextEventId++;
    }

    function updateEvent(
        uint256 _eventId,
        string memory _name,
        string memory _location,
        uint256 _price,
        uint256 _totalTickets
    ) external {
        Event storage myEvent = events[_eventId];

        if (myEvent.creator == address(0)) revert Event_Not_Found();
        if (msg.sender != myEvent.creator) revert Not_Event_Creator();
        if (myEvent.ticketsSold > 0) revert Cannot_Update_Sold_Out();
        if (_totalTickets <= 0) revert Need_Ticket();

        myEvent.name = _name;
        myEvent.location = _location;
        myEvent.price = _price;
        myEvent.totalTickets = _totalTickets;
    }

    function deleteEvent(uint256 _eventId) external {
        Event storage myEvent = events[_eventId];

        if (myEvent.creator == address(0)) revert Event_Not_Found();
        if (msg.sender != myEvent.creator) revert Not_Event_Creator();
        if (myEvent.ticketsSold > 0) revert Cannot_Update_Sold_Out();

        delete events[_eventId];
    }

    function buyTicket(uint256 _eventId, string memory _tokenURI) external {
        Event storage myEvent = events[_eventId];

        if (myEvent.totalTickets <= myEvent.ticketsSold) revert Sold_Out();

        uint256 allowance = paymentToken.allowance(msg.sender, address(this));
        if (allowance < myEvent.price) revert Insufficient_Allowance();

        uint256 balance = paymentToken.balanceOf(msg.sender);
        if (balance < myEvent.price) revert Insufficient_Balance();
        balance - myEvent.price;

        bool success = paymentToken.transferFrom(
            msg.sender,
            myEvent.creator,
            myEvent.price
        );
        if (!success) revert Payment_Failed();

        ticketNFT.safeMint(msg.sender, _tokenURI);
        myEvent.ticketsSold++;
    }
}
