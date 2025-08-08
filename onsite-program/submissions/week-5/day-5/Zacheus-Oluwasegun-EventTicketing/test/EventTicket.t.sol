// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {EventTicketing} from "../src/EventTicket.sol";
import {TicketNFT} from "../src/TicketNft.sol";
import {TicketToken} from "../src/TicketToken.sol";

contract EventTicketingTest is Test {
    EventTicketing public eventTicketing;
    TicketNFT public ticketNft;
    TicketToken public ticketToken;
    uint initialSupply = 1_000_000;
    string event_name = "Shoplaa";
    uint price = 400;
    uint max_ticket = 20;

    address address1 = address(0x343534);
    address address2 = address(0x876583);

    function setUp() public {
        ticketToken = new TicketToken(initialSupply);
        ticketNft = new TicketNFT();
        eventTicketing = new EventTicketing(
            address(ticketToken),
            address(ticketNft),
            event_name,
            400,
            20
        );
    }

    function test_Deployment() public view {
        assertEq(eventTicketing.getEventDetails().event_name, event_name);
        assertEq(ticketToken.totalSupply(), initialSupply);
        assertEq(
            ticketToken.balanceOf(eventTicketing.getOwner()),
            initialSupply
        );
    }

    function test_RevertWhenCallerBalanceIsLow() public {
        vm.expectRevert("Insufficient balance");
        vm.prank(address1);
        eventTicketing.buyTicket();
    }

    function test_BuyTicket() public {
        ticketToken.transfer(address1, 700);

        vm.prank(address1);
        ticketToken.approve(address(eventTicketing), 400);

        vm.prank(address1);
        eventTicketing.buyTicket();

        assertEq(eventTicketing.hasTicket(address1), true);
        assertEq(eventTicketing.getTicketsSold(), 1);
    }
}
