// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {EventTicketing} from "../src/EventTicketing.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock ERC20 token for testing
contract MockTicketToken is ERC20 {
    constructor() ERC20("TicketToken", "TTK") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}

contract EventTicketingTest is Test {
    EventTicketing public eventTicketing;
    MockTicketToken public ticketToken;
    address public owner;
    address public user1;
    address public user2;

    uint256 constant TICKET_PRICE = 100 * 10 ** 18; // 100 tokens
    uint256 constant TOTAL_TICKETS = 10;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        // Deploy mock token and transfer some to users
        ticketToken = new MockTicketToken();
        ticketToken.transfer(user1, 1000 * 10 ** 18);
        ticketToken.transfer(user2, 1000 * 10 ** 18);

        // Deploy EventTicketing contract
        eventTicketing = new EventTicketing(address(ticketToken));

        // Approve contract to spend tokens for users
        vm.startPrank(user1);
        ticketToken.approve(address(eventTicketing), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(user2);
        ticketToken.approve(address(eventTicketing), type(uint256).max);
        vm.stopPrank();
    }

    function testCreateEvent() public {
        vm.prank(owner);
        eventTicketing.createEvent("Test Event", TOTAL_TICKETS, TICKET_PRICE);

        (uint256 eventId, string memory name, uint256 totalTickets, uint256 ticketsSold, uint256 ticketPrice, bool isActive) = eventTicketing.events(1);
        assertEq(eventId, 1, "Event ID should be 1");
        assertEq(name, "Test Event", "Event name mismatch");
        assertEq(totalTickets, TOTAL_TICKETS, "Total tickets mismatch");
        assertEq(ticketsSold, 0, "Tickets sold should be 0");
        assertEq(ticketPrice, TICKET_PRICE, "Ticket price mismatch");
        assertTrue(isActive, "Event should be active");
    }

    function testFailCreateEventNonOwner() public {
        vm.prank(user1);
        vm.expectRevert("Only owner can call this function");
        eventTicketing.createEvent("Test Event", TOTAL_TICKETS, TICKET_PRICE);
    }

    function testFailCreateEventZeroTickets() public {
        vm.prank(owner);
        vm.expectRevert("Total tickets must be greater than 0");
        eventTicketing.createEvent("Test Event", 0, TICKET_PRICE);
    }

    function testBuyTicket() public {
        vm.prank(owner);
        eventTicketing.createEvent("Test Event", TOTAL_TICKETS, TICKET_PRICE);

        uint256 initialOwnerBalance = ticketToken.balanceOf(owner);
        vm.prank(user1);
        eventTicketing.buyTicket(1);

        (uint256 ticketId, uint256 eventId, address ticketOwner, bool isUsed) = eventTicketing.tickets(1);
        assertEq(ticketId, 1, "Ticket ID should be 1");
        assertEq(eventId, 1, "Event ID mismatch");
        assertEq(ticketOwner, user1, "Ticket owner mismatch");
        assertFalse(isUsed, "Ticket should not be used");

        (, , , uint256 ticketsSold, , ) = eventTicketing.events(1);
        assertEq(ticketsSold, 1, "Tickets sold should be 1");
        assertEq(ticketToken.balanceOf(owner), initialOwnerBalance + TICKET_PRICE, "Owner balance incorrect");
    }

    function testFailBuyTicketInactiveEvent() public {
        vm.prank(owner);
        eventTicketing.createEvent("Test Event", TOTAL_TICKETS, TICKET_PRICE);

        vm.prank(owner);
        eventTicketing.toggleEventActive(1);

        vm.prank(user1);
        vm.expectRevert("Event is not active");
        eventTicketing.buyTicket(1);
    }

    function testFailBuyTicketNoTicketsAvailable() public {
        vm.prank(owner);
        eventTicketing.createEvent("Test Event", 1, TICKET_PRICE);

        vm.prank(user1);
        eventTicketing.buyTicket(1);

        vm.prank(user2);
        vm.expectRevert("No tickets available");
        eventTicketing.buyTicket(1);
    }

    function testFailBuyTicketInsufficientBalance() public {
        vm.prank(owner);
        eventTicketing.createEvent("Test Event", TOTAL_TICKETS, TICKET_PRICE);

        address poorUser = address(0x3);
        vm.prank(poorUser);
        vm.expectRevert("Insufficient token balance");
        eventTicketing.buyTicket(1);
    }

    function testFailBuyTicketNoAllowance() public {
        vm.prank(owner);
        eventTicketing.createEvent("Test Event", TOTAL_TICKETS, TICKET_PRICE);

        address noAllowanceUser = address(0x4);
        ticketToken.transfer(noAllowanceUser, 1000 * 10 ** 18);

        vm.prank(noAllowanceUser);
        vm.expectRevert("Insufficient allowance");
        eventTicketing.buyTicket(1);
    }

    function testUseTicket() public {
        vm.prank(owner);
        eventTicketing.createEvent("Test Event", TOTAL_TICKETS, TICKET_PRICE);

        vm.prank(user1);
        eventTicketing.buyTicket(1);

        vm.prank(user1);
        eventTicketing.useTicket(1);

        (, , , bool isUsed) = eventTicketing.tickets(1);
        assertTrue(isUsed, "Ticket should be used");
    }

    function testFailUseTicketNonOwner() public {
        vm.prank(owner);
        eventTicketing.createEvent("Test Event", TOTAL_TICKETS, TICKET_PRICE);

        vm.prank(user1);
        eventTicketing.buyTicket(1);

        vm.prank(user2);
        vm.expectRevert("Not ticket owner");
        eventTicketing.useTicket(1);
    }

    function testFailUseTicketAlreadyUsed() public {
        vm.prank(owner);
        eventTicketing.createEvent("Test Event", TOTAL_TICKETS, TICKET_PRICE);

        vm.prank(user1);
        eventTicketing.buyTicket(1);

        vm.prank(user1);
        eventTicketing.useTicket(1);

        vm.prank(user1);
        vm.expectRevert("Ticket already used");
        eventTicketing.useTicket(1);
    }

    function testFailUseTicketInactiveEvent() public {
        vm.prank(owner);
        eventTicketing.createEvent("Test Event", TOTAL_TICKETS, TICKET_PRICE);

        vm.prank(user1);
        eventTicketing.buyTicket(1);

        vm.prank(owner);
        eventTicketing.toggleEventActive(1);

        vm.prank(user1);
        vm.expectRevert("Event is not active");
        eventTicketing.useTicket(1);
    }

    function testToggleEventActive() public {
        vm.prank(owner);
        eventTicketing.createEvent("Test Event", TOTAL_TICKETS, TICKET_PRICE);

        vm.prank(owner);
        eventTicketing.toggleEventActive(1);

        (, , , , , bool isActive) = eventTicketing.events(1);
        assertFalse(isActive, "Event should be inactive");

        vm.prank(owner);
        eventTicketing.toggleEventActive(1);

        (, , , , , isActive) = eventTicketing.events(1);
        assertTrue(isActive, "Event should be active");
    }

    function testFailToggleEventActiveNonOwner() public {
        vm.prank(owner);
        eventTicketing.createEvent("Test Event", TOTAL_TICKETS, TICKET_PRICE);

        vm.prank(user1);
        vm.expectRevert("Only owner can call this function");
        eventTicketing.toggleEventActive(1);
    }

    function testFailToggleEventActiveNonExistent() public {
        vm.prank(owner);
        vm.expectRevert("Event does not exist");
        eventTicketing.toggleEventActive(1);
    }
}