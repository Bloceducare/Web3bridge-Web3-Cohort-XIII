// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {TiketToken} from "../src/Ticketing.sol";
import {TiketItem} from "../src/TicketNFT.sol";
import {EventTicketing} from "../src/EventTicketing.sol";

contract EventTicketingTest is Test {
    TiketToken token;
    TiketItem nft;
    EventTicketing ticketing;

    address owner = address(0xABCD);
    address buyer1 = address(0xBEEF);
    address buyer2 = address(0xCAFE);

    uint256 initialSupply = 1000 ether;
    uint256 ticketPrice = 10 ether;
    uint256 totalTickets = 5;

    function setUp() public {
        vm.startPrank(owner);
        token = new TiketToken(initialSupply);
        nft = new TiketItem();
        ticketing = new EventTicketing(
            address(nft),
            address(token),
            ticketPrice,
            totalTickets,
            "Test Event",
            "Event Description"
        );
        vm.stopPrank();

        vm.prank(owner);
        token.transfer(buyer1, 100 ether);
        vm.prank(owner);
        token.transfer(buyer2, 100 ether);

        vm.prank(buyer1);
        token.approve(address(ticketing), type(uint256).max);

        vm.prank(buyer2);
        token.approve(address(ticketing), type(uint256).max);
    }

    function testInitialState() view public {
        assertEq(ticketing.ticketPrice(), ticketPrice);
        assertEq(ticketing.totalTickets(), totalTickets);
        assertEq(ticketing.ticketsSold(), 0);
        assertEq(ticketing.ticketsRemaining(), totalTickets);
        assertEq(ticketing.salesActive(), true);
        assertEq(ticketing.eventOwner(), owner);
    }

    function testBuyTicket() public {
        vm.prank(buyer1);
        ticketing.buyTicket("ipfs://ticket1");

        assertEq(ticketing.ticketsSold(), 1);
        assertEq(ticketing.ticketsRemaining(), totalTickets - 1);
        assertEq(token.balanceOf(buyer1), 100 ether - ticketPrice);
        assertEq(token.balanceOf(address(ticketing)), ticketPrice);
        assertEq(nft.ownerOf(0), buyer1);
        assertEq(nft.tokenURI(0), "ipfs://ticket1");
    }

    function testBuyMultipleTickets() public {
        vm.prank(buyer1);
        ticketing.buyTicket("ipfs://ticket1");
        vm.prank(buyer2);
        ticketing.buyTicket("ipfs://ticket2");

        assertEq(ticketing.ticketsSold(), 2);
        assertEq(ticketing.ticketsRemaining(), totalTickets - 2);
        assertEq(nft.ownerOf(0), buyer1);
        assertEq(nft.ownerOf(1), buyer2);
    }

    function testCannotBuyWhenSoldOut() public {
        for (uint256 i = 0; i < totalTickets; i++) {
            vm.prank(buyer1);
            ticketing.buyTicket("ipfs://ticket");
        }
        assertEq(ticketing.ticketsRemaining(), 0);
        vm.prank(buyer2);
        vm.expectRevert("Sold out");
        ticketing.buyTicket("ipfs://ticket");
    }

    function testOnlyOwnerCanSetTicketPrice() public {
        vm.prank(owner);
        ticketing.setTicketPrice(20 ether);
        assertEq(ticketing.ticketPrice(), 20 ether);

        vm.prank(buyer1);
        vm.expectRevert("Not event owner");
        ticketing.setTicketPrice(30 ether);
    }

    function testOnlyOwnerCanWithdrawTokens() public {
        vm.prank(buyer1);
        ticketing.buyTicket("ipfs://ticket1");

        vm.prank(owner);
        ticketing.withdrawTokens(owner, ticketPrice);

        assertEq(
            token.balanceOf(owner),
            initialSupply - 200 ether + ticketPrice
        );

        vm.prank(buyer1);
        vm.expectRevert("Not event owner");
        ticketing.withdrawTokens(buyer1, ticketPrice);
    }

    function testCloseSales() public {
        vm.prank(owner);
        ticketing.closeSales();
        assertEq(ticketing.salesActive(), false);

        vm.prank(buyer1);
        vm.expectRevert("Sales closed");
        ticketing.buyTicket("ipfs://ticket1");
    }

    function testTicketsRemainingCalculation() public {
        vm.prank(buyer1);
        ticketing.buyTicket("ipfs://ticket1");
        assertEq(ticketing.ticketsRemaining(), totalTickets - 1);

        vm.prank(owner);
        ticketing.closeSales();
        assertEq(ticketing.salesActive(), false);
    }

     function testBuyTicketAndMapping() public {
        vm.prank(buyer1);
        ticketing.buyTicket("ipfs://ticket1");

        assertEq(ticketing.ticketsBoughtCount(buyer1), 1);
        assertEq(ticketing.tokenIdOfBuyerByIndex(buyer1, 0), 0);

        vm.prank(buyer1);
        ticketing.buyTicket("ipfs://ticket2");

        assertEq(ticketing.ticketsBoughtCount(buyer1), 2);
        assertEq(ticketing.tokenIdOfBuyerByIndex(buyer1, 1), 1);

        vm.prank(buyer2);
        ticketing.buyTicket("ipfs://ticket3");

        assertEq(ticketing.ticketsBoughtCount(buyer2), 1);
        assertEq(ticketing.tokenIdOfBuyerByIndex(buyer2, 0), 2);
    }

    function testTokenIdOutOfBounds() public {
        vm.prank(buyer1);
        ticketing.buyTicket("ipfs://ticket1");

        vm.expectRevert("Index out of bounds");
        ticketing.tokenIdOfBuyerByIndex(buyer1, 1);
    }

}