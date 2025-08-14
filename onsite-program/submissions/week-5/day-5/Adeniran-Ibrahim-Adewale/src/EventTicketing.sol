// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ITicketNft {
    function mintForRegistrant(address to, uint256 ticketId) external returns (uint256);
}

contract EventTicketing is  Ownable {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    Counters.Counter private _ticketIds;

    struct Ticket {
        uint256 id;
        address creator;      // ticket/event owner
        IERC20 paymentToken;  // token accepted for payment
        uint256 price;        // price in token smallest units
        uint256 eventTimestamp; // unix timestamp when event starts
        bool closed;          // manually closed OR after event
        string metadata;      // optional metadata (URI)
    }

    // ticket id => Ticket
    mapping(uint256 => Ticket) public tickets;

    // ticket id => list of registrants
    mapping(uint256 => address[]) private registrants;

    // ticket id => address => registered?
    mapping(uint256 => mapping(address => bool)) public isRegistered;

    // ticket id => address => tokenId of the NFT
    mapping(uint256 => mapping(address => uint256)) public registrantTokenIds;

    ITicketNft public ticketNft;

    event TicketCreated(uint256 indexed ticketId, address indexed creator, uint256 price, uint256 eventTimestamp);
    event Registered(uint256 indexed ticketId, address indexed registrant, uint256 nftTokenId);
    event TicketUpdated(uint256 indexed ticketId, uint256 newPrice, uint256 newTimestamp);
    event TicketClosed(uint256 indexed ticketId, address indexed closedBy);
    event TicketRefunded(uint256 indexed ticketId, address indexed registrant, uint256 amount);

    constructor(address ticketNftAddress) {
        require(ticketNftAddress != address(0), "TicketNft address required");
        ticketNft = ITicketNft(ticketNftAddress);
    }

    /// @notice Create a new ticket/event
    /// @param paymentToken address of ERC20 token accepted for payment
    /// @param price price per ticket in the token's smallest unit
    /// @param eventTimestamp unix timestamp when the event starts
    /// @param metadata optional metadata URI for the event
    function createTicket(
        address paymentToken,
        uint256 price,
        uint256 eventTimestamp,
        string calldata metadata
    ) external returns (uint256) {
        require(eventTimestamp > block.timestamp, "Event must be in the future");
        require(paymentToken != address(0), "Payment token required");

        _ticketIds.increment();
        uint256 newTicketId = _ticketIds.current();

        tickets[newTicketId] = Ticket({
            id: newTicketId,
            creator: msg.sender,
            paymentToken: IERC20(paymentToken),
            price: price,
            eventTimestamp: eventTimestamp,
            closed: false,
            metadata: metadata
        });

        emit TicketCreated(newTicketId, msg.sender, price, eventTimestamp);
        return newTicketId;
    }

    /// @notice Update ticket price and/or event time (ticket creator only)
    /// @param ticketId ID of the ticket to update
    /// @param newPrice New price for the ticket (0 to keep current)
    /// @param newTimestamp New event timestamp (0 to keep current)
    function updateTicket(
        uint256 ticketId,
        uint256 newPrice,
        uint256 newTimestamp
    ) external {
        Ticket storage ticket = tickets[ticketId];
        require(ticket.creator == msg.sender, "Only ticket creator can update");
        require(ticket.id != 0, "Ticket does not exist");
        require(!ticket.closed, "Ticket is closed");
        
        if (newTimestamp > 0) {
            require(newTimestamp > block.timestamp, "New time must be in the future");
            ticket.eventTimestamp = newTimestamp;
        }
        
        if (newPrice > 0) {
            ticket.price = newPrice;
        }
        
        emit TicketUpdated(ticketId, newPrice, newTimestamp);
    }

    /// @notice Close ticket sales (ticket creator only)
    /// @param ticketId ID of the ticket to close
    function closeTicket(uint256 ticketId) external {
        Ticket storage ticket = tickets[ticketId];
        require(ticket.creator == msg.sender || msg.sender == owner(), "Not authorized");
        require(ticket.id != 0, "Ticket does not exist");
        require(!ticket.closed, "Ticket already closed");
        
        ticket.closed = true;
        emit TicketClosed(ticketId, msg.sender);
    }

    /// @notice Helper to check if ticket is available (not closed and event not started)
    function isAvailable(uint256 ticketId) public view returns (bool) {
        Ticket storage t = tickets[ticketId];
        if (t.id == 0) return false; // Ticket doesn't exist
        if (t.closed) return false;   // Ticket is closed
        return block.timestamp < t.eventTimestamp; // Event hasn't started
    }

    /// @notice Register for an already-created ticket by paying the required token.
    /// Caller must approve this contract to spend `price` tokens beforehand.
    function register(uint256 ticketId) external nonReentrant returns (uint256) {
        Ticket storage t = tickets[ticketId];
        require(t.id != 0, "ticket not found");
        require(!t.closed, "ticket closed");
        require(block.timestamp < t.eventTimestamp, "event already started/passed");
        require(!isRegistered[ticketId][msg.sender], "already registered");

        // Pay the ticket price to ticket creator
        t.paymentToken.safeTransferFrom(msg.sender, t.creator, t.price);

        // mark registered
        registrants[ticketId].push(msg.sender);
        isRegistered[ticketId][msg.sender] = true;

        // mint NFT for registrant
        uint256 nftTokenId = ticketNft.mintForRegistrant(msg.sender, ticketId);
        registrantTokenIds[ticketId][msg.sender] = nftTokenId;

        emit Registered(ticketId, msg.sender, nftTokenId);
        return nftTokenId;
    }

    /// @notice Get all registrants for a ticket
    function getRegistrants(uint256 ticketId) external view returns (address[] memory) {
        return registrants[ticketId];
    }

    /// @notice Set TicketNft contract (owner only). Useful for migrations.
    function setTicketNft(address ticketNftAddress) external onlyOwner {
        require(ticketNftAddress != address(0), "zero addr");
        ticketNft = ITicketNft(ticketNftAddress);
    }

    /// @notice Read ticket details
    function getTicket(uint256 ticketId) external view returns (
        uint256 id,
        address creator,
        address paymentToken,
        uint256 price,
        uint256 eventTimestamp,
        bool closed,
        string memory metadata
    ) {
        Ticket storage t = tickets[ticketId];
        require(t.id != 0, "ticket not found");
        return (t.id, t.creator, address(t.paymentToken), t.price, t.eventTimestamp, t.closed, t.metadata);
    }

    /// @notice Convenience: owner can withdraw accidentally sent ERC20 to this contract (rare since we forward payments).
    function rescueERC20(IERC20 token, address to, uint256 amount) external onlyOwner {
        token.safeTransfer(to, amount);
    }
}
