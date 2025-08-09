// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/EventTicketing.sol";
import "../src/TicketNft.sol";
import "../src/TicketToken.sol";

contract EventTicketingTest is Test {
    // Contract instances
    EventTicketing public eventTicketing;
    TicketNft public ticketNft;
    TicketToken public ticketToken;
    
    // Test addresses
    address public owner;
    address public organizer;
    address public buyer1;
    address public buyer2;
    
    // Test constants
    uint256 constant INITIAL_TOKEN_SUPPLY = 1000000 * 10**18;
    uint256 constant TICKET_PRICE = 100 * 10**18; // 100 tokens
    uint256 constant TOTAL_TICKETS = 50;
    string constant EVENT_NAME = "Test Concert";
    string constant EVENT_DESCRIPTION = "A test concert event";
    
    function setUp() public {
        // Set up test addresses
        owner = address(this);
        organizer = makeAddr("organizer");
        buyer1 = makeAddr("buyer1");
        buyer2 = makeAddr("buyer2");
        
        // Deploy contracts
        ticketToken = new TicketToken (INITIAL_TOKEN_SUPPLY);
        ticketNft = new TicketNft();
        eventTicketing = new EventTicketing(address(ticketNft), address(ticketToken));
        
        
        
        // Transfer tokens to test users
        ticketToken.transfer(buyer1, 10000 * 10**18); // 10,000 tokens
        ticketToken.transfer(buyer2, 5000 * 10**18);  // 5,000 tokens
        
        // Label addresses for better trace output
        vm.label(address(eventTicketing), "EventTicketing");
        vm.label(address(ticketNft), "TicketNft");
        vm.label(address(ticketToken), "TicketToken");
        vm.label(organizer, "Organizer");
        vm.label(buyer1, "Buyer1");
        vm.label(buyer2, "Buyer2");
    }

    // Test 1: Contract Deployment and Initial State
    function test_InitialState() public {
        assertEq(eventTicketing.owner(), owner);
        assertEq(eventTicketing.nextEventId(), 1);
        assertEq(address(eventTicketing.ticketNft()), address(ticketNft));
        assertEq(address(eventTicketing.ticketToken()), address(ticketToken));
        
        console.log("Initial state test passed");
    }
    
    // Test 2: Create Event Successfully
    function test_CreateEvent() public {
        vm.prank(organizer);
        eventTicketing.createEvent(EVENT_NAME, EVENT_DESCRIPTION, TICKET_PRICE, TOTAL_TICKETS);
        
        EventTicketing.Event memory eventData = eventTicketing.getEvent(1);
        
        assertEq(eventData.eventId, 1);
        assertEq(eventData.name, EVENT_NAME);
        assertEq(eventData.description, EVENT_DESCRIPTION);
        assertEq(eventData.organizer, organizer);
        assertEq(eventData.ticketPrice, TICKET_PRICE);
        assertEq(eventData.totalTickets, TOTAL_TICKETS);
        assertEq(eventData.soldTickets, 0);
        assertTrue(eventData.isActive);
        
        console.log("Create event test passed");
    }
    
    // Test 3: Create Event Emits Correct Event
    function test_CreateEventEmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit EventTicketing.EventCreated(1, EVENT_NAME, organizer);
        
        vm.prank(organizer);
        eventTicketing.createEvent(EVENT_NAME, EVENT_DESCRIPTION, TICKET_PRICE, TOTAL_TICKETS);
        
        console.log("Create event emission test passed");
    }

}