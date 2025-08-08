// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./TicketToken.sol";
import "./TicketNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract EventFactory is Ownable {
    constructor(address initialOwner) Ownable(initialOwner) {}

    struct EventInfo {
        address erc20Token;
        address nftTicket;
        address organizer;
        uint256 ticketPrice;
        uint256 totalTickets;
        uint256 ticketsSold;
    }

    uint256 public eventCount;
    mapping(uint256 => EventInfo) public events;

    event EventCreated(uint256 indexed eventId, address erc20Token, address nftTicket, address organizer);

    function createEvent(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 tokenSupply,
        string memory nftName,
        string memory nftSymbol,
        uint256 ticketPrice,
        uint256 totalTickets
    ) external returns (address erc20Address, address nftAddress) {
        // Token — minted fully to organizer
        TicketToken erc20 = new TicketToken(tokenName, tokenSymbol, tokenSupply, msg.sender);

        // NFT — ownership given to the factory so it can mint tickets
        BilalNFT nft = new BilalNFT(nftName, nftSymbol, address(this));

        events[eventCount] = EventInfo({
            erc20Token: address(erc20),
            nftTicket: address(nft),
            organizer: msg.sender,
            ticketPrice: ticketPrice,
            totalTickets: totalTickets,
            ticketsSold: 0
        });

        erc20Address = address(erc20);
        nftAddress = address(nft);

        emit EventCreated(eventCount, erc20Address, nftAddress, msg.sender);

        eventCount++;
    }

    function buyTicket(uint256 eventId, string memory tokenURI) external {
        EventInfo storage evt = events[eventId];
        require(evt.ticketsSold < evt.totalTickets, "Sold out");

        IERC20 paymentToken = IERC20(evt.erc20Token);
        require(paymentToken.transferFrom(msg.sender, evt.organizer, evt.ticketPrice), "Payment failed");

        BilalNFT(evt.nftTicket).mintBilalNFT(msg.sender, tokenURI);
        evt.ticketsSold++;
    }

    function mintExtraNFT(uint256 eventId, address to, string memory tokenURI) external {
        EventInfo storage evt = events[eventId];
        require(msg.sender == evt.organizer, "Only organizer can mint extra NFTs");
        
        BilalNFT(evt.nftTicket).mintBilalNFT(to, tokenURI);
    }
}