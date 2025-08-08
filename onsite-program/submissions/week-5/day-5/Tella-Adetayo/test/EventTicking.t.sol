// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {EventTicketing} from "../src/EventTicketing.sol";
import {TicketNFT} from "../src/TicketNFT.sol";
import {TicketToken} from "../src/TicketToken.sol"; 

contract EventTicketingTest is Test {
    EventTicketing public eventTicketing; 
    TicketNFT public ticketNFT; 
    TicketToken public ticketToken; 
    address creator = address(0x123); 
    receive() external payable {}

    function setUp() public {
        ticketNFT = new TicketNFT(); 
        ticketToken = new TicketToken(1000);

        //vm.deal(creator, 1 ether);
        //vm.prank(creator); 

        eventTicketing = new EventTicketing(
            address(ticketToken), 
            address(ticketNFT), 
            0.01 ether, 
            0.005 ether
        ); 

        vm.deal(creator, 1 ether);
    }

    function test_createTicket() public {
        //vm.deal(creator, 1 ether);

        string memory tokenURI = "ipfs://QmSomeHas"; 

        vm.startPrank(creator);
        eventTicketing.createTicket{value: 0.01 ether}(tokenURI, 10, 100, "This is my event", block.timestamp+1); 
        vm.stopPrank(); 

        EventTicketing.TicketInfo memory ticket = eventTicketing.getTicketInfo(1);
        assertEq(ticket.totalTickets, 10);
        assertEq(ticket.ticketPrice, 100);
        assertEq(ticket.creator, creator);
        
    }

    function test_totalTicketIsZero() public {
        //vm.deal(creator, 1 ether); 

        string memory tokenURI = "ipfs://QmSomeHas"; 

        vm.startPrank(creator);
        vm.expectRevert(EventTicketing.TICKET_MUST_BE_GREATER_THAN_ZERO.selector);
        eventTicketing.createTicket{value: 0.01 ether}(tokenURI, 0, 100, "This is my event", block.timestamp+1);
        vm.stopPrank();

    }

    function test_totalTicketGreaterThanZero() public {
        //vm.deal(creator, 1 ether);
        string memory tokenURI = "ipfs://QmSomeHas";

        vm.startPrank(creator);
        vm.expectRevert(EventTicketing.TICKET_PRICE_MUST_BE_GREATER_THAN_ZERO.selector); 
        eventTicketing.createTicket{value: 0.01 ether}(tokenURI, 10, 0, "This is my event", block.timestamp+1);
        vm.stopPrank();
    }

    function test_tickDateShouldBeFuture() public {
        //vm.deal(creator, 1 ether); 
        string memory tokenURI = "ipfs://QmSomeHas";

        vm.startPrank(creator);
        vm.expectRevert(EventTicketing.TICKET_DATE_SHOULD_BE_FUTURE.selector); 
        eventTicketing.createTicket{value: 0.01 ether}(tokenURI, 10, 200, "This is my event", block.timestamp-1);
    }

    function test_purchaseTicket() public {
    string memory tokenURI = "ipfs://QmSomeHas";
    address buyer = address(0x456);
    vm.deal(buyer, 10 ether);

    vm.startPrank(creator);
    eventTicketing.createTicket{value: 0.01 ether}(
        tokenURI,
        10,
        200,
        "This is my event",
        block.timestamp + 1
    );
    vm.stopPrank();

    uint256 ticketId = 1;
    uint256 quantity = 2;
    uint256 totalCost = 200 * quantity;

    vm.startPrank(buyer);
    eventTicketing.purchaseTicket{value: totalCost}(ticketId, quantity, tokenURI);
    vm.stopPrank();

    EventTicketing.BuyerInfo[] memory purchasers = eventTicketing.getPurchaseInfo(ticketId);
    assertEq(purchasers.length, 1);
    assertEq(purchasers[0].buyer, buyer);
}

function test_incorrectAmountSent() public {
    string memory tokenURI = "ipfs://QmSomeHas";
    address buyer = address(0x456);
    vm.deal(buyer, 10 ether);

    vm.startPrank(creator);
    eventTicketing.createTicket{value: 0.01 ether}(
        tokenURI,
        10,
        200,
        "This is my event",
        block.timestamp + 1
    );
    vm.stopPrank();

    uint256 ticketId = 1;
    uint256 quantity = 2;
    uint256 incorrectAmount = 123; // not equal to ticketPrice * quantity

    vm.startPrank(buyer);
    vm.expectRevert(EventTicketing.INCORRECT_AMOUNT_SENT.selector);
    eventTicketing.purchaseTicket{value: incorrectAmount}(ticketId, quantity, tokenURI);
    vm.stopPrank();
    }

}