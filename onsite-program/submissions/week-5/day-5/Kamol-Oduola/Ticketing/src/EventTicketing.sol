// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./TicketToken.sol";
import "./TicketNft.sol";

contract EventTicketing {
    address public organizer;
    TicketToken public ticketToken;
    TicketNft public ticketNft;

    uint256 public nextTicketId;
    uint256 public ticketCount;

    enum Status { Going, NotGoing, Default }

    struct EventDetails {
        address organizer;
        string event_name;
        string event_venue;
    }

    struct TicketDetails {
        uint256 id;
        uint256 ticket_price;
        uint256 ticket_supply;
        Status status;
    }

    mapping(uint256 => TicketDetails) public tickets;
    mapping(address => uint256[]) public userTickets;

    constructor(address _ticketToken, address _ticketNft) {
        organizer = msg.sender;
        ticketToken = TicketToken(_ticketToken);
        ticketNft = TicketNft(_ticketNft);
    }

    function createTicket(uint256 price, uint256 supply) external {
        require(msg.sender == organizer, "Only organizer can create tickets");

        tickets[nextTicketId] = TicketDetails({
            id: nextTicketId,
            ticket_price: price,
            ticket_supply: supply,
            status: Status.Default
        });

        nextTicketId++;
    }

    function buyTicket(uint256 ticketId, string memory tokenURI) external {
        TicketDetails storage ticket = tickets[ticketId];

        require(ticket.ticket_supply > 0, "Sold Out");

        // Transfer ERC20 tokens from buyer to organizer
        require(
            ticketToken.transferFrom(msg.sender, organizer, ticket.ticket_price),
            "Payment failed"
        );

        // Mint the NFT to buyer
        ticketNft.mintTicketNft(msg.sender, ticketCount, tokenURI);

        // Track ownership and reduce supply
        userTickets[msg.sender].push(ticketCount);
        ticketCount++;
        ticket.ticket_supply--;
    }
}
