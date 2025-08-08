// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TicketNft.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EventTicketing is Ownable {
    struct Event {
        uint256 eventId;
        string name;
        
        uint256 ticketPrice;
        uint256 totalTickets;
        uint256 ticketsSold;
        
        string baseTokenURI;
        uint256[] ticketIds;
    }

    uint256 public eventCounter;
    mapping(uint256 => Event) public events;
    mapping(address => uint256[]) public userEvents;

    IERC20 public paymentToken;
    TicketNft public ticketNft;

    event EventCreated(uint256 indexed eventId, string name, address creator);
    event TicketPurchased(uint256 indexed eventId, uint256 ticketId, address buyer);

    constructor(address _paymentToken, address _ticketNft) {
        require(_paymentToken != address(0), "Invalid token address");
        require(_ticketNft != address(0), "Invalid NFT address");

        paymentToken = IERC20(_paymentToken);
        ticketNft = TicketNft(_ticketNft);
    }

    function createEvent(
        string memory _name,
        uint256 _ticketPrice,
        uint256 _totalTickets,
        string memory _baseTokenURI
    ) external {

        require(_totalTickets > 0, "Tickets must be greater than zero");

        eventCounter++;
        uint256 eventId = eventCounter;

        events[eventId] = Event({
            eventId: eventId,
            name: _name,
            ticketPrice: _ticketPrice,
            totalTickets: _totalTickets,
            ticketsSold: 0,
            baseTokenURI: _baseTokenURI,
            ticketIds: new uint256[](0)
        });

        userEvents[msg.sender].push(eventId);

        emit EventCreated(eventId, _name, msg.sender);
    }

    function purchaseTicket(uint256 eventId) external {
        Event storage ev = events[eventId];

        require(ev.ticketsSold < ev.totalTickets, "All tickets sold");

        // Mint the NFT ticket to the buyer
        uint256 ticketId = ticketNft.mintTicket(msg.sender, ev.baseTokenURI);
        ev.ticketIds.push(ticketId);
        ev.ticketsSold++;

        emit TicketPurchased(eventId, ticketId, msg.sender);
    }

    function getUserEvents(address user) external view returns (uint256[] memory) {
        return userEvents[user];
    }

    function getEventTickets(uint256 eventId) external view returns (uint256[] memory) {
        return events[eventId].ticketIds;
    }
}
