// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { TicketToken } from "./TicketToken.sol";
import { BilalNFT } from "./TicketNFT.sol";
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
        uint256 eventStartDate;
        uint256 eventEndDate;
    }

    error ALL_TICKETS_SOLD();
    error PAYMENT_FAILED();
    error ONLY_ORGANIZER_CAN_CALL();
    error TICKET_CLOSED();
    error TOTAL_TICKETS_IS_NEEDED();

    uint256 public eventCount;
    mapping(uint256 => EventInfo) public events;

    event EventCreated(uint256 indexed eventId, address erc20Token, address nftTicket, address organizer);

    function createEvent(
        string memory _tokenName, 
        string memory _tokenSymbol, 
        uint256 _tokenSupply, 
        string memory _nftName, 
        string memory _nftSymbol, 
        uint256 _ticketPrice, 
        uint256 _totalTickets, 
        uint256 _eventEndDate
    ) external returns (address erc20Address, address nftAddress) {
        // Token — minted fully to organizer
        if(_totalTickets <= 0) {
            revert TOTAL_TICKETS_IS_NEEDED();
        }
        TicketToken erc20 = new TicketToken(_tokenName, _tokenSymbol, _tokenSupply, msg.sender);

        // NFT — ownership given to the factory so it can mint tickets
        BilalNFT nft = new BilalNFT(_nftName, _nftSymbol, address(this));

        events[eventCount] = EventInfo({
            erc20Token: address(erc20),
            nftTicket: address(nft),
            organizer: msg.sender,
            ticketPrice: _ticketPrice,
            totalTickets: _totalTickets,
            ticketsSold: 0,
            eventStartDate: block.timestamp,
            eventEndDate: _eventEndDate
        });

        erc20Address = address(erc20);
        nftAddress = address(nft);

        emit EventCreated(eventCount, erc20Address, nftAddress, msg.sender);

        eventCount++;
    }

    function isActiveEvent(uint256 eventId) public view returns (bool) {
        EventInfo storage evt = events[eventId];
        return (block.timestamp >= evt.eventStartDate && block.timestamp <= evt.eventEndDate);
    }

    function buyTicket(uint256 eventId, string memory tokenURI) external {
        EventInfo storage evt = events[eventId];
        
        if (evt.ticketsSold >= evt.totalTickets) {
            revert ALL_TICKETS_SOLD();
        }

        if (!isActiveEvent(eventId)) {
            revert TICKET_CLOSED();
        }

        IERC20 paymentToken = IERC20(evt.erc20Token);
        if (!paymentToken.transferFrom(msg.sender, evt.organizer, evt.ticketPrice)) {
            revert PAYMENT_FAILED();
        }

        BilalNFT(evt.nftTicket).mintBilalNFT(msg.sender, tokenURI);
        evt.ticketsSold++;
    }

    function mintExtraNFT(uint256 eventId, address to, string memory tokenURI) external {
        EventInfo storage evt = events[eventId];
        if (msg.sender != evt.organizer) {
            revert ONLY_ORGANIZER_CAN_CALL();
        }
        BilalNFT(evt.nftTicket).mintBilalNFT(to, tokenURI);
    }

    function getEventInfo(uint eventId) external view returns (EventInfo memory) {
        return events[eventId];
    }

    function getEventCount() external view returns (uint256) {
        return eventCount;
    }

    function getEventById(uint256 eventId) external view returns (EventInfo memory) {
        return events[eventId];
    }
}