// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/TicketNft.sol";
import "../contracts/TicketToken.sol";
import "../contracts/EventTicketing.sol";

contract EventTicketingTest is Test {
    TicketNft ticketNft;
    TicketToken ticketToken;
    EventTicketing eventTicketing;
    address owner = address(0x1);
    address user = address(0x2);
    address eventCreator = address(0x3);

    function setUp() public {
        vm.startPrank(owner);
        ticketNft = new TicketNft();
        ticketToken = new TicketToken(1000000 * 10**18); 
        eventTicketing = new EventTicketing(address(ticketToken), address(ticketNft));

        ticketNft.authorizeMinter(address(eventTicketing));

        vm.stopPrank();

        vm.prank(owner);
        ticketToken.transfer(user, 1000 * 10**18); 
    }

    function testCreateEvent() public {
        vm.prank(eventCreator);
        string memory name = "Concert";
        uint256 ticketPrice = 10 * 10**18;
        uint256 totalTickets = 100;
        string memory baseTokenURI = "https://event.com/ticket/";

       
        eventTicketing.createEvent(name, ticketPrice, totalTickets, baseTokenURI);

       
        (uint256 eventId, string memory eventName, uint256 price, uint256 total, uint256 sold, string memory uri) = eventTicketing.events(1);
        assertEq(eventId, 1, "Event ID should be 1");
        assertEq(eventName, name, "Event name should match");
        assertEq(price, ticketPrice, "Ticket price should match");
        assertEq(total, totalTickets, "Total tickets should match");
        assertEq(sold, 0, "Tickets sold should be 0");
        assertEq(uri, baseTokenURI, "Base token URI should match");

    
        uint256[] memory userEventIds = eventTicketing.getUserEvents(eventCreator);
        assertEq(userEventIds.length, 1, "User should have one event");
        assertEq(userEventIds[0], 1, "User event ID should be 1");
    }

    function testPurchaseTicket() public {
        vm.prank(eventCreator);
        string memory baseTokenURI = "https://event.com/ticket/";
        eventTicketing.createEvent("Concert", 10 * 10**18, 100, baseTokenURI);
        uint256 eventId = 1;

        
        vm.prank(user);
        eventTicketing.purchaseTicket(eventId);

        
        uint256 tokenId = 0; 
        assertEq(ticketNft.ownerOf(tokenId), user, "Ticket should be owned by user");
        assertEq(ticketNft.getTokenURI(tokenId), baseTokenURI, "Token URI should match");

       
        (, , , , uint256 ticketsSold, string memory uri) = eventTicketing.events(eventId);
        uint256[] memory ticketIds = eventTicketing.getEventTickets(eventId);
        assertEq(ticketsSold, 1, "Tickets sold should be 1");
        assertEq(ticketIds.length, 1, "Ticket IDs length should be 1");
        assertEq(ticketIds[0], tokenId, "Ticket ID should match");
    }

    function testPurchaseTicketAllSold() public {
        vm.prank(eventCreator);
        
        eventTicketing.createEvent("Concert", 10 * 10**18, 1, "https://event.com/ticket/");
        uint256 eventId = 1;

        vm.prank(user);
        eventTicketing.purchaseTicket(eventId);

        vm.prank(user);
        vm.expectRevert("All tickets sold");
        eventTicketing.purchaseTicket(eventId);
    }
}