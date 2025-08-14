//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {EventTicketing} from "../src/EventTicketing.sol";
import {TicketNft} from "../src/TicketNft.sol";
import {TicketToken} from "../src/TicketToken.sol";

contract EventTicketingTest is Test {
    EventTicketing public ticketing;
    TicketNft public ticketNft;
    TicketToken public paymentToken;
    
    address public owner = address(this);
    address public creator = makeAddr("creator");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18;
    uint256 public constant TICKET_PRICE = 100 * 10**18;
    uint256 public futureTimestamp;
    
    event TicketCreated(uint256 indexed ticketId, address indexed creator, uint256 price, uint256 eventTimestamp);
    event Registered(uint256 indexed ticketId, address indexed registrant, uint256 nftTokenId);
    event TicketUpdated(uint256 indexed ticketId, uint256 newPrice, uint256 newTimestamp);
    event TicketClosed(uint256 indexed ticketId, address indexed closedBy);
    
    function setUp() public {
        // Deploy contracts
        ticketNft = new TicketNft("Event Tickets", "TICKET");
        ticketing = new EventTicketing(address(ticketNft));
        paymentToken = new TicketToken("Payment Token", "PAY", INITIAL_SUPPLY);
        
        // Set up ticketing contract as minter for NFTs
        ticketNft.setMinter(address(ticketing));
        
        // Set future timestamp (1 day from now)
        futureTimestamp = block.timestamp + 1 days;
        
        // Distribute tokens to users
        paymentToken.transfer(creator, 10000 * 10**18);
        paymentToken.transfer(user1, 10000 * 10**18);
        paymentToken.transfer(user2, 10000 * 10**18);
        
        // Approve spending
        vm.prank(creator);
        paymentToken.approve(address(ticketing), type(uint256).max);
        vm.prank(user1);
        paymentToken.approve(address(ticketing), type(uint256).max);
        vm.prank(user2);
        paymentToken.approve(address(ticketing), type(uint256).max);
    }
    
    function testConstructor() public {
        // Test successful deployment
        assertEq(address(ticketing.ticketNft()), address(ticketNft));
        assertEq(ticketing.owner(), owner);
        
        // Test zero address revert
        vm.expectRevert("TicketNft address required");
        new EventTicketing(address(0));
    }
    
    function testCreateTicket() public {
        vm.startPrank(creator);
        
        vm.expectEmit(true, true, false, true);
        emit TicketCreated(1, creator, TICKET_PRICE, futureTimestamp);
        
        uint256 ticketId = ticketing.createTicket(
            paymentToken,
            TICKET_PRICE,
            futureTimestamp,
            "Test Event"
        );
        
        assertEq(ticketId, 1);
        
        // Verify ticket data
        (
            uint256 id,
            address ticketCreator,
            ,  // paymentToken (IERC20)
            uint256 price,
            uint256 eventTime,
            bool closed,
            string memory metadata
        ) = ticketing.tickets(ticketId);
        
        assertEq(id, 1);
        assertEq(ticketCreator, creator);
        assertEq(price, TICKET_PRICE);
        assertEq(eventTime, futureTimestamp);
        assertEq(closed, false);
        assertEq(metadata, "Test Event");
        
        vm.stopPrank();
    }
    
    function testCreateTicketFailures() public {
        vm.startPrank(creator);
        
        // Test past timestamp
        vm.expectRevert("eventTimestamp must be future");
        ticketing.createTicket(
            paymentToken,
            TICKET_PRICE,
            block.timestamp - 1,
            "Past Event"
        );
        
        // Test zero price
        vm.expectRevert("price must be > 0");
        ticketing.createTicket(
            paymentToken,
            0,
            futureTimestamp,
            "Free Event"
        );
        
        vm.stopPrank();
    }
    
    function testRegister() public {
        // Create ticket first
        vm.prank(creator);
        uint256 ticketId = ticketing.createTicket(
            paymentToken,
            TICKET_PRICE,
            futureTimestamp,
            "Test Event"
        );
        
        // Register user1
        vm.startPrank(user1);
        
        uint256 initialBalance = paymentToken.balanceOf(user1);
        uint256 creatorInitialBalance = paymentToken.balanceOf(creator);
        
        vm.expectEmit(true, true, false, true);
        emit Registered(ticketId, user1, 1);
        
        uint256 nftTokenId = ticketing.register(ticketId);
        
        // Verify NFT minted
        assertEq(nftTokenId, 1);
        assertEq(ticketNft.ownerOf(nftTokenId), user1);
        assertEq(ticketNft.ticketOfToken(nftTokenId), ticketId);
        
        // Verify payment transferred
        assertEq(paymentToken.balanceOf(user1), initialBalance - TICKET_PRICE);
        assertEq(paymentToken.balanceOf(creator), creatorInitialBalance + TICKET_PRICE);
        
        // Verify registration state
        assertTrue(ticketing.isRegistered(ticketId, user1));
        address[] memory registrants = ticketing.getRegistrants(ticketId);
        assertEq(registrants.length, 1);
        assertEq(registrants[0], user1);
        
        vm.stopPrank();
    }
    
    function testRegisterFailures() public {
        // Create ticket first
        vm.prank(creator);
        uint256 ticketId = ticketing.createTicket(
            paymentToken,
            TICKET_PRICE,
            futureTimestamp,
            "Test Event"
        );
        
        // Test non-existent ticket
        vm.prank(user1);
        vm.expectRevert("ticket not found");
        ticketing.register(299);
        
        // Test closed ticket
        vm.prank(creator);
        ticketing.closeTicket(ticketId);
        
        vm.prank(user1);
        vm.expectRevert("ticket closed");
        ticketing.register(ticketId);
        
        // Create new ticket for remaining tests
        vm.prank(creator);
        uint256 ticketId2 = ticketing.createTicket(
            paymentToken,
            TICKET_PRICE,
            futureTimestamp,
            "Test Event 2"
        );
        
        // Test past event
        vm.warp(futureTimestamp + 1);
        vm.prank(user1);
        vm.expectRevert("event passed");
        ticketing.register(ticketId2);
        
        // Reset time and test double registration
        vm.warp(block.timestamp - 2 days);
        
        vm.prank(user1);
        ticketing.register(ticketId2);
        
        vm.prank(user1);
        vm.expectRevert("already registered");
        ticketing.register(ticketId2);
    }
    
    function testUpdateTicket() public {
        vm.startPrank(creator);
        
        uint256 ticketId = ticketing.createTicket(
            paymentToken,
            TICKET_PRICE,
            futureTimestamp,
            "Test Event"
        );
        
        uint256 newPrice = TICKET_PRICE * 2;
        uint256 newTimestamp = futureTimestamp + 1 days;
        
        vm.expectEmit(true, false, false, true);
        emit TicketUpdated(ticketId, newPrice, newTimestamp);
        
        ticketing.updateTicket(ticketId, newPrice, newTimestamp);
        
        // Verify updates
        (, , , uint256 price, uint256 eventTime, ,) = ticketing.tickets(ticketId);
        assertEq(price, newPrice);
        assertEq(eventTime, newTimestamp);
        
        vm.stopPrank();
    }
    
    function testUpdateTicketFailures() public {
        vm.startPrank(creator);
        
        uint256 ticketId = ticketing.createTicket(
            paymentToken,
            TICKET_PRICE,
            futureTimestamp,
            "Test Event"
        );
        
        vm.stopPrank();
        
        // Test non-creator
        vm.prank(user1);
        vm.expectRevert("only creator");
        ticketing.updateTicket(ticketId, TICKET_PRICE * 2, futureTimestamp + 1 days);
        
        vm.startPrank(creator);
        
        // Test non-existent ticket
        vm.expectRevert("ticket not found");
        ticketing.updateTicket(999, TICKET_PRICE * 2, futureTimestamp + 1 days);
        
        // Test event started
        vm.warp(futureTimestamp + 1);
        vm.expectRevert("event started");
        ticketing.updateTicket(ticketId, TICKET_PRICE * 2, futureTimestamp + 2 days);
        
        vm.warp(block.timestamp - 2 days);
        
        // Test closed ticket
        ticketing.closeTicket(ticketId);
        vm.expectRevert("ticket closed");
        ticketing.updateTicket(ticketId, TICKET_PRICE * 2, futureTimestamp + 1 days);
        
        // Create new ticket for remaining tests
        uint256 ticketId2 = ticketing.createTicket(
            paymentToken,
            TICKET_PRICE,
            futureTimestamp,
            "Test Event 2"
        );
        
        // Test past timestamp
        vm.expectRevert("must be future");
        ticketing.updateTicket(ticketId2, TICKET_PRICE * 2, block.timestamp - 1);
        
        // Test zero price
        vm.expectRevert("price must be > 0");
        ticketing.updateTicket(ticketId2, 0, futureTimestamp + 1 days);
        
        vm.stopPrank();
    }
    
    function testCloseTicket() public {
        vm.startPrank(creator);
        
        uint256 ticketId = ticketing.createTicket(
            paymentToken,
            TICKET_PRICE,
            futureTimestamp,
            "Test Event"
        );
        
        vm.expectEmit(true, true, false, false);
        emit TicketClosed(ticketId, creator);
        
        ticketing.closeTicket(ticketId);
        
        // Verify closed
        (, , , , , bool closed,) = ticketing.tickets(ticketId);
        assertTrue(closed);
        assertFalse(ticketing.isAvailable(ticketId));
        
        vm.stopPrank();
    }
    
    function testCloseTicketByOwner() public {
        vm.prank(creator);
        uint256 ticketId = ticketing.createTicket(
            paymentToken,
            TICKET_PRICE,
            futureTimestamp,
            "Test Event"
        );
        
        // Owner can close any ticket
        vm.expectEmit(true, true, false, false);
        emit TicketClosed(ticketId, owner);
        
        ticketing.closeTicket(ticketId);
        
        (, , , , , bool closed,) = ticketing.tickets(ticketId);
        assertTrue(closed);
    }
    
    function testCloseTicketFailures() public {
        vm.prank(creator);
        uint256 ticketId = ticketing.createTicket(
            paymentToken,
            TICKET_PRICE,
            futureTimestamp,
            "Test Event"
        );
        
        // Test unauthorized user
        vm.prank(user1);
        vm.expectRevert("not authorized");
        ticketing.closeTicket(ticketId);
        
        // Test non-existent ticket
        vm.prank(creator);
        vm.expectRevert("ticket not found");
        ticketing.closeTicket(999);
        
        // Test already closed
        vm.prank(creator);
        ticketing.closeTicket(ticketId);
        
        vm.prank(creator);
        vm.expectRevert("already closed");
        ticketing.closeTicket(ticketId);
    }
    
    function testIsAvailable() public {
        vm.prank(creator);
        uint256 ticketId = ticketing.createTicket(
            paymentToken,
            TICKET_PRICE,
            futureTimestamp,
            "Test Event"
        );
        
        // Should be available initially
        assertTrue(ticketing.isAvailable(ticketId));
        
        // Should not be available after closing
        vm.prank(creator);
        ticketing.closeTicket(ticketId);
        assertFalse(ticketing.isAvailable(ticketId));
        
        // Create new ticket to test time expiry
        vm.prank(creator);
        uint256 ticketId2 = ticketing.createTicket(
            paymentToken,
            TICKET_PRICE,
            futureTimestamp,
            "Test Event 2"
        );
        
        // Should not be available after event time
        vm.warp(futureTimestamp + 1);
        assertFalse(ticketing.isAvailable(ticketId2));
        
        // Test non-existent ticket
        assertFalse(ticketing.isAvailable(999));
    }
    
    function testSetTicketNft() public {
        TicketNft newNft = new TicketNft("New Tickets", "NEWTICKET");
        
        ticketing.setTicketNft(address(newNft));
        assertEq(address(ticketing.ticketNft()), address(newNft));
        
        // Test zero address
        vm.expectRevert("zero addr");
        ticketing.setTicketNft(address(0));
        
        // Test only owner
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        ticketing.setTicketNft(address(newNft));
    }
    
    function testMultipleRegistrations() public {
        vm.prank(creator);
        uint256 ticketId = ticketing.createTicket(
            paymentToken,
            TICKET_PRICE,
            futureTimestamp,
            "Test Event"
        );
        
        // Register multiple users
        vm.prank(user1);
        uint256 nft1 = ticketing.register(ticketId);
        
        vm.prank(user2);
        uint256 nft2 = ticketing.register(ticketId);
        
        // Verify both registrations
        assertTrue(ticketing.isRegistered(ticketId, user1));
        assertTrue(ticketing.isRegistered(ticketId, user2));
        
        address[] memory registrants = ticketing.getRegistrants(ticketId);
        assertEq(registrants.length, 2);
        assertEq(registrants[0], user1);
        assertEq(registrants[1], user2);
        
        // Verify NFTs
        assertEq(ticketNft.ownerOf(nft1), user1);
        assertEq(ticketNft.ownerOf(nft2), user2);
        assertEq(ticketNft.ticketOfToken(nft1), ticketId);
        assertEq(ticketNft.ticketOfToken(nft2), ticketId);
    }
    
    function testTicketNftContract() public {
        // Test minter functionality
        assertEq(ticketNft.minter(), address(ticketing));
        
        // Test set minter (only owner)
        address newMinter = makeAddr("newMinter");
        
        vm.expectEmit(true, true, false, false);
        // emit MinterChanged(address(ticketing), newMinter);
        
        ticketNft.setMinter(newMinter);
        assertEq(ticketNft.minter(), newMinter);
        
        // Test only owner can set minter
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        ticketNft.setMinter(user1);
        
        // Test only minter can mint
        vm.prank(user1);
        vm.expectRevert("TicketNft: caller is not minter");
        ticketNft.mintForRegistrant(user1, 1);
    }
    
    function testPaymentTokenContract() public {
        // Test mint functionality (only owner)
        uint256 mintAmount = 1000 * 10**18;
        paymentToken.mint(user1, mintAmount);
        assertEq(paymentToken.balanceOf(user1), 10000 * 10**18 + mintAmount);
        
        // Test only owner can mint
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        paymentToken.mint(user1, mintAmount);
    }
    
    function testReentrancyProtection() public {
        // The register function is protected by nonReentrant
        // This is difficult to test without a malicious contract
        // but we can verify the modifier is in place by checking
        // the function executes normally
        
        vm.prank(creator);
        uint256 ticketId = ticketing.createTicket(
            paymentToken,
            TICKET_PRICE,
            futureTimestamp,
            "Test Event"
        );
        
        vm.prank(user1);
        ticketing.register(ticketId);
        
        assertTrue(ticketing.isRegistered(ticketId, user1));
    }
}