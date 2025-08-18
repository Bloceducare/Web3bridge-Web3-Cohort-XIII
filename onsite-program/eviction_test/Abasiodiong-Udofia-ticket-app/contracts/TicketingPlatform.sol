// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/ITicketingPlatform.sol";
import "./libraries/Errors.sol";
import "./TicketNFT.sol";

contract TicketingPlatform is ITicketingPlatform {
    TicketNFT private ticketNFT;
    mapping(uint256 => Event) private events;
    mapping(address => uint256[]) private creatorEvents;
    mapping(uint256 => mapping(uint256 => uint256)) private ticketToTokenId; // eventId => ticketId => tokenId
    uint256 private nextEventId;

    constructor() {
        ticketNFT = new TicketNFT(address(this));
    }

    function createEvent(string memory _name, uint256 _ticketPrice, uint256 _totalTickets) external override {
        if (msg.sender == address(0)) revert Errors.InvalidAddress();
        if (bytes(_name).length == 0) revert Errors.NameCannotBeEmpty();
        if (_ticketPrice == 0) revert Errors.InvalidTicketPrice();
        if (_totalTickets == 0) revert Errors.InvalidTicketCount();

        events[nextEventId] = Event(nextEventId, _name, _ticketPrice, _totalTickets, 0, EventStatus.ACTIVE, true);
        creatorEvents[msg.sender].push(nextEventId);
        emit EventCreated(msg.sender, nextEventId, _name, _ticketPrice, _totalTickets);
        nextEventId++;
    }

    function purchaseTicket(uint256 _eventId) external payable override {
        if (!events[_eventId].exists) revert Errors.EventNotFound(_eventId);
        if (events[_eventId].status != EventStatus.ACTIVE) revert Errors.EventNotActive(_eventId);
        if (events[_eventId].ticketsSold >= events[_eventId].totalTickets) revert Errors.NoTicketsAvailable(_eventId);
        if (msg.value < events[_eventId].ticketPrice) revert Errors.InsufficientPayment(events[_eventId].ticketPrice, msg.value);

        Event storage evt = events[_eventId];
        uint256 ticketId = evt.ticketsSold;
        uint256 tokenId = ticketNFT.mint(msg.sender);
        ticketToTokenId[_eventId][ticketId] = tokenId;
        evt.ticketsSold++;

        // Refund excess payment
        if (msg.value > evt.ticketPrice) {
            (bool success, ) = msg.sender.call{value: msg.value - evt.ticketPrice}("");
            require(success, "Refund failed");
        }

        emit TicketPurchased(msg.sender, _eventId, ticketId, tokenId);
    }

    function closeEvent(uint256 _eventId) external override {
        if (!events[_eventId].exists) revert Errors.EventNotFound(_eventId);
        if (creatorEvents[msg.sender].length == 0) revert Errors.NotEventCreator(_eventId);
        bool isCreator = false;
        for (uint256 i = 0; i < creatorEvents[msg.sender].length; i++) {
            if (creatorEvents[msg.sender][i] == _eventId) {
                isCreator = true;
                break;
            }
        }
        if (!isCreator) revert Errors.NotEventCreator(_eventId);

        events[_eventId].status = EventStatus.CLOSED;
        emit EventClosed(msg.sender, _eventId);
    }

    function getEvent(uint256 _eventId) external view override returns (Event memory) {
        if (!events[_eventId].exists) revert Errors.EventNotFound(_eventId);
        return events[_eventId];
    }

    function getEventsByCreator(address _creator) external view override returns (uint256[] memory) {
        uint256[] memory activeEvents = new uint256[](creatorEvents[_creator].length);
        uint256 count = 0;
        for (uint256 i = 0; i < creatorEvents[_creator].length; i++) {
            if (events[creatorEvents[_creator][i]].exists) {
                activeEvents[count] = creatorEvents[_creator][i];
                count++;
            }
        }
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeEvents[i];
        }
        return result;
    }

    function getTicketTokenId(uint256 _eventId, uint256 _ticketId) external view override returns (uint256) {
        if (!events[_eventId].exists) revert Errors.EventNotFound(_eventId);
        if (_ticketId >= events[_eventId].ticketsSold) revert Errors.EventNotFound(_eventId);
        return ticketToTokenId[_eventId][_ticketId];
    }

    function getTicketNFTAddress() external view returns (address) {
        return address(ticketNFT);
    }
}