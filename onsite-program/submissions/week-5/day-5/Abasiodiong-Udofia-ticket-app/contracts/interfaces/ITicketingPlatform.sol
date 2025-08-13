// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ITicketingPlatform {
    enum EventStatus {
        ACTIVE,
        CLOSED
    }

    struct Event {
        uint256 id;
        string name;
        uint256 ticketPrice;
        uint256 totalTickets;
        uint256 ticketsSold;
        EventStatus status;
        bool exists;
    }

    event EventCreated(
        address indexed creator,
        uint256 eventId,
        string name,
        uint256 ticketPrice,
        uint256 totalTickets
    );
    event TicketPurchased(
        address indexed buyer,
        uint256 eventId,
        uint256 ticketId,
        uint256 tokenId
    );
    event EventClosed(address indexed creator, uint256 eventId);

    function createEvent(
        string memory _name,
        uint256 _ticketPrice,
        uint256 _totalTickets
    ) external;
    function purchaseTicket(uint256 _eventId) external payable;
    function closeEvent(uint256 _eventId) external;
    function getEvent(uint256 _eventId) external view returns (Event memory);
    function getEventsByCreator(
        address _creator
    ) external view returns (uint256[] memory);
    function getTicketTokenId(
        uint256 _eventId,
        uint256 _ticketId
    ) external view returns (uint256);
}
