// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./lib/Counters.sol";
import "./EventNFTs.sol";
import "./EventToken.sol";

contract Event is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    EventToken public immutable eventToken;
    EventNFTs public immutable eventNFTs;

    Counters.Counter private _eventIdCounter;

    struct EventInfo {
        string name;
        string description;
        uint256 ticketPrice;
        uint256 maxTickets;
        uint256 soldTickets;
        uint256 startTime;
        uint256 endTime;
        string venue;
        bool isActive;
        string metadataURI;
    }

    mapping(uint256 => EventInfo) public events;
    mapping(uint256 => mapping(address => uint256[])) public userTickets;
    mapping(address => bool) public authorizedValidators;

    event EventCreated(
        uint256 indexed eventId,
        string name,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 startTime,
        uint256 endTime
    );
    event TicketPurchased(
        uint256 indexed eventId,
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 price
    );
    event EntryValidated(
        uint256 indexed eventId,
        uint256 indexed tokenId,
        address indexed attendee
    );
    event EventStatusChanged(uint256 indexed eventId, bool isActive);

    constructor(address _eventToken, address _eventNFTs) Ownable(msg.sender) {
        eventToken = EventToken(_eventToken);
        eventNFTs = EventNFTs(_eventNFTs);
        authorizedValidators[msg.sender] = true;
    }

    modifier onlyValidator() {
        require(authorizedValidators[msg.sender], "Not authorized validator");
        _;
    }

    function createEvent(
        string memory name,
        string memory description,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 startTime,
        uint256 endTime,
        string memory venue,
        string memory metadataURI
    ) public onlyOwner returns (uint256) {
        require(
            startTime > block.timestamp,
            "Start time must be in the future"
        );
        require(endTime > startTime, "End time must be after start time");
        require(maxTickets > 0, "Max tickets must be greater than 0");

        uint256 eventId = _eventIdCounter.current();
        _eventIdCounter.increment();

        events[eventId] = EventInfo({
            name: name,
            description: description,
            ticketPrice: ticketPrice,
            maxTickets: maxTickets,
            soldTickets: 0,
            startTime: startTime,
            endTime: endTime,
            venue: venue,
            isActive: true,
            metadataURI: metadataURI
        });

        emit EventCreated(
            eventId,
            name,
            ticketPrice,
            maxTickets,
            startTime,
            endTime
        );

        return eventId;
    }

    function toggleEventStatus(uint256 eventId) public onlyOwner {
        require(eventId < _eventIdCounter.current(), "Event does not exist");

        events[eventId].isActive = !events[eventId].isActive;
        emit EventStatusChanged(eventId, events[eventId].isActive);
    }

    // FIXED: Only allow users to buy tickets for themselves
    function purchaseTicket(
        uint256 eventId
    ) public nonReentrant returns (uint256) {
        EventInfo storage eventInfo = events[eventId];

        require(eventId < _eventIdCounter.current(), "Event does not exist");
        require(eventInfo.isActive, "Event is not active");
        require(eventInfo.soldTickets < eventInfo.maxTickets, "Event sold out");
        require(
            block.timestamp < eventInfo.startTime,
            "Event has already started"
        );

        // FIXED: Check allowance before attempting transfer
        require(
            eventToken.allowance(msg.sender, address(this)) >=
                eventInfo.ticketPrice,
            "Insufficient token allowance"
        );
        require(
            eventToken.balanceOf(msg.sender) >= eventInfo.ticketPrice,
            "Insufficient token balance"
        );

        require(
            eventToken.transferFrom(
                msg.sender,
                address(this),
                eventInfo.ticketPrice
            ),
            "Token transfer failed"
        );

        uint256 tokenId = eventNFTs.mintTicket(
            msg.sender,
            eventId,
            eventInfo.metadataURI
        );

        eventInfo.soldTickets++;
        userTickets[eventId][msg.sender].push(tokenId);

        emit TicketPurchased(
            eventId,
            tokenId,
            msg.sender,
            eventInfo.ticketPrice
        );

        return tokenId;
    }

    function purchaseMultipleTickets(
        uint256 eventId,
        uint256 quantity
    ) public nonReentrant returns (uint256[] memory) {
        require(quantity > 0 && quantity <= 10, "Invalid quantity (1-10)");

        EventInfo storage eventInfo = events[eventId];
        require(eventId < _eventIdCounter.current(), "Event does not exist");
        require(eventInfo.isActive, "Event is not active");
        require(
            eventInfo.soldTickets + quantity <= eventInfo.maxTickets,
            "Not enough tickets available"
        );
        require(
            block.timestamp < eventInfo.startTime,
            "Event has already started"
        );

        uint256 totalCost = eventInfo.ticketPrice * quantity;

        // FIXED: Check allowance before attempting transfer
        require(
            eventToken.allowance(msg.sender, address(this)) >= totalCost,
            "Insufficient token allowance"
        );
        require(
            eventToken.balanceOf(msg.sender) >= totalCost,
            "Insufficient token balance"
        );

        require(
            eventToken.transferFrom(msg.sender, address(this), totalCost),
            "Token transfer failed"
        );

        uint256[] memory tokenIds = new uint256[](quantity);

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = eventNFTs.mintTicket(
                msg.sender,
                eventId,
                eventInfo.metadataURI
            );

            tokenIds[i] = tokenId;
            userTickets[eventId][msg.sender].push(tokenId);

            emit TicketPurchased(
                eventId,
                tokenId,
                msg.sender,
                eventInfo.ticketPrice
            );
        }

        eventInfo.soldTickets += quantity;

        return tokenIds;
    }

    function validateEntry(
        uint256 tokenId
    ) public onlyValidator returns (bool) {
        require(
            eventNFTs.ownerOf(tokenId) != address(0),
            "Ticket does not exist"
        );
        require(
            eventNFTs.isTicketValid(tokenId),
            "Ticket is not valid or already used"
        );

        uint256 eventId = eventNFTs.getEventForTicket(tokenId);
        EventInfo memory eventInfo = events[eventId];

        require(eventInfo.isActive, "Event is not active");
        require(
            block.timestamp >= eventInfo.startTime &&
                block.timestamp <= eventInfo.endTime,
            "Event is not currently active"
        );

        eventNFTs.useTicket(tokenId);

        address attendee = eventNFTs.ownerOf(tokenId);
        emit EntryValidated(eventId, tokenId, attendee);

        return true;
    }

    function canEnterEvent(
        uint256 tokenId
    ) public view returns (bool, string memory) {
        if (eventNFTs.ownerOf(tokenId) == address(0)) {
            return (false, "Ticket does not exist");
        }

        if (!eventNFTs.isTicketValid(tokenId)) {
            return (false, "Ticket is not valid or already used");
        }

        uint256 eventId = eventNFTs.getEventForTicket(tokenId);
        EventInfo memory eventInfo = events[eventId];

        if (!eventInfo.isActive) {
            return (false, "Event is not active");
        }

        if (block.timestamp < eventInfo.startTime) {
            return (false, "Event has not started yet");
        }

        if (block.timestamp > eventInfo.endTime) {
            return (false, "Event has ended");
        }

        return (true, "Ticket is valid for entry");
    }

    function addValidator(address validator) public onlyOwner {
        authorizedValidators[validator] = true;
    }

    function removeValidator(address validator) public onlyOwner {
        authorizedValidators[validator] = false;
    }

    function withdrawTokens() public onlyOwner {
        uint256 balance = eventToken.balanceOf(address(this));
        require(eventToken.transfer(owner(), balance), "Transfer failed");
    }

    function emergencyWithdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function getEvent(uint256 eventId) public view returns (EventInfo memory) {
        require(eventId < _eventIdCounter.current(), "Event does not exist");
        return events[eventId];
    }

    function getUserTickets(
        uint256 eventId,
        address user
    ) public view returns (uint256[] memory) {
        return userTickets[eventId][user];
    }

    function getActiveEvents() public view returns (uint256[] memory) {
        uint256 totalEvents = _eventIdCounter.current();
        uint256 activeCount = 0;

        for (uint256 i = 0; i < totalEvents; i++) {
            if (events[i].isActive) {
                activeCount++;
            }
        }

        uint256[] memory activeEvents = new uint256[](activeCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalEvents; i++) {
            if (events[i].isActive) {
                activeEvents[currentIndex] = i;
                currentIndex++;
            }
        }

        return activeEvents;
    }

    function getTotalEvents() public view returns (uint256) {
        return _eventIdCounter.current();
    }

    function isTicketHolder(
        uint256 eventId,
        address user
    ) public view returns (bool) {
        return userTickets[eventId][user].length > 0;
    }
}
