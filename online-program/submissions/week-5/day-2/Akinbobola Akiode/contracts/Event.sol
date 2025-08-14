// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

contract EventContract {
    uint256 public eventCount;
    uint256 public ticketCount;

    enum EventType { Free, Paid }
    enum EventStatus { Upcoming, Ongoing, Completed, Cancelled }

    struct Event {
        string title;
        string description;
        uint256 startDate;
        uint256 endDate;
        address organizer;
        uint256 ticketPrice;
        string eventBanner;
        EventType eventType;
        EventStatus status;
        uint256 totalTickets;
        uint256 ticketsSold;
    }

    struct Ticket {
        uint256 eventId;
        address owner;
    }

    mapping(uint256 => Event) public events;
    mapping(uint256 => Ticket) public tickets;
    mapping(address => uint256[]) public userTickets;
    mapping(uint256 => address) private _ticketApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => uint256) private _eventProceeds;
    mapping(uint256 => bool) private _eventWithdrawn;

    string private _baseTicketURI;
    address private immutable _admin;

    event EventCreated(uint256 indexed eventId, address indexed organizer, string title);
    event TicketMinted(address indexed to, uint256 indexed ticketId, uint256 indexed eventId);
    event Transfer(address indexed from, address indexed to, uint256 indexed ticketId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed ticketId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event ProceedsWithdrawn(uint256 indexed eventId, address indexed organizer, uint256 amount);

    constructor(string memory baseURI) {
        _baseTicketURI = baseURI;
        _admin = msg.sender;
    }

    modifier eventExists(uint256 eventId) {
        require(events[eventId].organizer != address(0), "Event does not exist");
        _;
    }

    modifier ticketExists(uint256 ticketId) {
        require(tickets[ticketId].owner != address(0), "Ticket does not exist");
        _;
    }

    function createEvent(
        string calldata title,
        string calldata description,
        uint256 startDate,
        uint256 endDate,
        uint256 ticketPrice,
        string calldata eventBanner,
        EventType eventType,
        uint256 totalTickets
    ) external {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(startDate < endDate, "Invalid dates");
        require(totalTickets > 0 && totalTickets <= 10000, "Invalid ticket count");
        
        if (eventType == EventType.Paid) {
            require(ticketPrice > 0, "Paid events must have a price");
        } else {
            require(ticketPrice == 0, "Free events must have zero price");
        }

        eventCount++;
        events[eventCount] = Event({
            title: title,
            description: description,
            startDate: startDate,
            endDate: endDate,
            organizer: msg.sender,
            ticketPrice: ticketPrice,
            eventBanner: eventBanner,
            eventType: eventType,
            status: EventStatus.Upcoming,
            totalTickets: totalTickets,
            ticketsSold: 0
        });
        
        emit EventCreated(eventCount, msg.sender, title);
    }

    function buyTicket(uint256 eventId) external payable eventExists(eventId) {
        Event storage evt = events[eventId];
        require(evt.status == EventStatus.Upcoming, "Event not available");
        require(evt.ticketsSold < evt.totalTickets, "Sold out");
        
        if (evt.eventType == EventType.Paid) {
            require(msg.value >= evt.ticketPrice, "Insufficient payment");
            require(msg.value <= evt.ticketPrice, "Excess payment");
            _eventProceeds[eventId] += msg.value;
        } else {
            require(msg.value == 0, "Free events do not require payment");
        }
        
        ticketCount++;
        tickets[ticketCount] = Ticket({
            eventId: eventId,
            owner: msg.sender
        });
        
        userTickets[msg.sender].push(ticketCount);
        evt.ticketsSold++;
        
        emit TicketMinted(msg.sender, ticketCount, eventId);
        emit Transfer(address(0), msg.sender, ticketCount);
    }

    function withdrawProceeds(uint256 eventId) external eventExists(eventId) {
        Event storage evt = events[eventId];
        require(msg.sender == evt.organizer, "Only organizer");
        require(!_eventWithdrawn[eventId], "Already withdrawn");
        
        uint256 proceeds = _eventProceeds[eventId];
        require(proceeds > 0, "No proceeds");
        
        _eventWithdrawn[eventId] = true;
        
        (bool sent, ) = payable(msg.sender).call{value: proceeds}("");
        require(sent, "Withdraw failed");
        
        emit ProceedsWithdrawn(eventId, msg.sender, proceeds);
    }

    function ownerOf(uint256 ticketId) public view ticketExists(ticketId) returns (address) {
        return tickets[ticketId].owner;
    }

    function transferFrom(address from, address to, uint256 ticketId) public ticketExists(ticketId) {
        require(_isApprovedOrOwner(msg.sender, ticketId), "Not owner nor approved");
        require(to != address(0), "Transfer to zero address");
        require(tickets[ticketId].owner == from, "Incorrect owner");
        
        tickets[ticketId].owner = to;
        _approve(address(0), ticketId);
        
        _removeFromUserTickets(from, ticketId);
        userTickets[to].push(ticketId);
        
        emit Transfer(from, to, ticketId);
    }

    function approve(address to, uint256 ticketId) external ticketExists(ticketId) {
        address owner = ownerOf(ticketId);
        require(to != owner, "Approval to current owner");
        require(msg.sender == owner, "Not owner");
        _approve(to, ticketId);
        emit Approval(owner, to, ticketId);
    }

    function getApproved(uint256 ticketId) public view ticketExists(ticketId) returns (address) {
        return _ticketApprovals[ticketId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        require(operator != msg.sender, "Approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function _approve(address to, uint256 ticketId) private {
        _ticketApprovals[ticketId] = to;
    }

    function _isApprovedOrOwner(address spender, uint256 ticketId) private view returns (bool) {
        address owner = ownerOf(ticketId);
        return (spender == owner || getApproved(ticketId) == spender || isApprovedForAll(owner, spender));
    }

    function _removeFromUserTickets(address user, uint256 ticketId) private {
        uint256[] storage userTicketList = userTickets[user];
        uint256 length = userTicketList.length;
        for (uint256 i = 0; i < length; i++) {
            if (userTicketList[i] == ticketId) {
                userTicketList[i] = userTicketList[length - 1];
                userTicketList.pop();
                break;
            }
        }
    }

    function getUserTickets(address user) external view returns (uint256[] memory) {
        return userTickets[user];
    }

    function ticketURI(uint256 ticketId) external view ticketExists(ticketId) returns (string memory) {
        return string(abi.encodePacked(_baseTicketURI, _toString(ticketId), ".json"));
    }

    function _toString(uint256 value) private pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}