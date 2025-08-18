// SPDX-License-License: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {EventTicketing} from "../src/EventTicketing.sol";
import {EventTicketNft} from "../src/TicketNft.sol";
import {EventTicketToken} from "../src/TicketToken.sol";

contract EventTicketingTest is Test {
    EventTicketing public eventTicketing;
    EventTicketNft public ticketNft;
    EventTicketToken public ticketToken;
    address public owner = address(0x1234567890123456789012345678901234567890);
    address public buyer = address(0x2);

    function setUp() public {
        
        vm.startPrank(owner);
        ticketNft = new EventTicketNft();
        ticketToken = new EventTicketToken(1000 * 10**18);
        eventTicketing = new EventTicketing(
            0.1 ether,
            10,
            1000 * 10**18,
            address(ticketNft),
            address(ticketToken)
        );
        vm.stopPrank();

        vm.prank(owner); 
        ticketToken.transfer(address(eventTicketing), 1000 * 10**18);
    }

    function testBuyTicket() public {
        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        eventTicketing.buyTicket{value: 0.1 ether}();


        assertTrue(eventTicketing.hasTicket(buyer));
        
        assertEq(ticketNft.ownerOf(1), buyer);
        
        assertEq(ticketToken.balanceOf(buyer), 100 * 10**18);
        
        assertEq(eventTicketing.getRemainingTickets(), 9);
    }

    // Test revert when insufficient Ether is sent
    function test_RevertWhen_InsufficientPayment() public {
        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        vm.expectRevert("Insufficient payment");
        eventTicketing.buyTicket{value: 0.01 ether}();
    }

    // Test revert when tickets are sold out
    function test_RevertWhen_TicketsSoldOut() public {
        // Create 10 different buyers
        for (uint i = 0; i < 10; i++) {
            address newBuyer = address(uint160(uint(keccak256(abi.encodePacked(i, block.timestamp)))));
            vm.deal(newBuyer, 1 ether);
            vm.prank(newBuyer);
            eventTicketing.buyTicket{value: 0.1 ether}();
        }
        // Try to buy one more ticket
        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        vm.expectRevert("No tickets left");
        eventTicketing.buyTicket{value: 0.1 ether}();
    }

    // Test revert when buyer already has a ticket
    function test_RevertWhen_AlreadyHasTicket() public {
        vm.deal(buyer, 1 ether);
        vm.startPrank(buyer);
        eventTicketing.buyTicket{value: 0.1 ether}();
        vm.expectRevert("Already purchased a ticket");
        eventTicketing.buyTicket{value: 0.1 ether}();
        vm.stopPrank();
    }

    // Test owner withdrawal
    function testWithdraw() public {
        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        eventTicketing.buyTicket{value: 0.1 ether}();

        uint256 initialBalance = owner.balance;
        vm.prank(owner);
        eventTicketing.withdraw();
        assertEq(owner.balance, initialBalance + 0.1 ether);
    }
}