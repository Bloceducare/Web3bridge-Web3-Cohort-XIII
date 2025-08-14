// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {TicketItem} from "../src/TicketNft.sol";
import {EventTicket} from "../src/EventTicket.sol";

contract EventTicketTest is Test {
    TicketItem ticketItem;
    EventTicket eventTicket;

    address buyer = address(0xBEEF);

    function setUp() public {
        ticketItem = new TicketItem();
        eventTicket = new EventTicket(address(ticketItem));
    }

    function testCreateEvent() public {
        eventTicket.createEvent("Test Event", block.timestamp + 1 days, 1 ether, 10);

        (address owner, string memory name,, uint256 ticketPrice, uint256 totalTickets, uint256 ticketsSold, bool salesOpen) = eventTicket.events(0);

        assertEq(owner, address(this));
        assertEq(name, "Test Event");
        assertEq(ticketPrice, 1 ether);
        assertEq(totalTickets, 10);
        assertEq(ticketsSold, 0);
        assertTrue(salesOpen);
    }

    function testBuyTicket() public {
        eventTicket.createEvent("Concert", block.timestamp + 1 days, 1 ether, 5);

        vm.deal(buyer, 5 ether);

        vm.prank(buyer);
        eventTicket.buyTicket{value: 1 ether}(0, "ipfs://ticket1");

        uint256 sold = eventTicket.ticketsSold(0);
        uint256 remaining = eventTicket.ticketsRemaining(0);

        assertEq(sold, 1);
        assertEq(remaining, 4);

        bool open = eventTicket.isSalesOpen(0);
        assertTrue(open);
    }

    function testUpdateTicketPrice() public {
        eventTicket.createEvent("Concert", block.timestamp + 1 days, 1 ether, 5);

        eventTicket.updateTicketPrice(0, 2 ether);

        (, , , uint256 ticketPrice, , , ) = eventTicket.events(0);

        assertEq(ticketPrice, 2 ether);
    }

    function testCloseSales() public {
        eventTicket.createEvent("Concert", block.timestamp + 1 days, 1 ether, 5);

        eventTicket.closeSales(0);

        bool open = eventTicket.isSalesOpen(0);
        assertFalse(open);
    }

    function testCannotBuyWhenSalesClosed() public {
        eventTicket.createEvent("Concert", block.timestamp + 1 days, 1 ether, 5);
        eventTicket.closeSales(0);

        vm.deal(buyer, 5 ether);
        vm.prank(buyer);

        vm.expectRevert("Ticket sales closed");
        eventTicket.buyTicket{value: 1 ether}(0, "ipfs://ticket1");
    }

    function testCannotBuyIfSoldOut() public {
        eventTicket.createEvent("Concert", block.timestamp + 1 days, 1 ether, 1);

        vm.deal(buyer, 5 ether);
        vm.prank(buyer);
        eventTicket.buyTicket{value: 1 ether}(0, "ipfs://ticket1");

        vm.prank(buyer);
        vm.expectRevert("Sold out");
        eventTicket.buyTicket{value: 1 ether}(0, "ipfs://ticket2");
    }

    function testCannotUpdatePriceIfNotOwner() public {
        eventTicket.createEvent("Concert", block.timestamp + 1 days, 1 ether, 5);

        vm.prank(buyer);
        vm.expectRevert("Not owner");
        eventTicket.updateTicketPrice(0, 5 ether);
    }

    function testCannotCloseSalesIfNotOwner() public {
        eventTicket.createEvent("Concert", block.timestamp + 1 days, 1 ether, 5);

        vm.prank(buyer);
        vm.expectRevert("Not owner");
        eventTicket.closeSales(0);
    }
}
