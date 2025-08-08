// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/Ticketing.sol";
import "../src/TicketToken.sol";
import "../src/TicketNFT.sol";

contract TicketingTest is Test {
    Ticketing ticketing;
    TicketToken token;
    TicketNFT nft;
    address organizer = address(0x1);
    address buyer = address(0x2);

    function setUp() public {
        vm.startPrank(organizer);
        token = new TicketToken(1000 ether);
        nft = new TicketNFT();
        ticketing = new Ticketing();

        token.transfer(buyer, 100 ether);
        vm.stopPrank();

        vm.prank(buyer);
        token.approve(address(ticketing), 100 ether);
    }

    function testCreateEvent() public {
        vm.prank(organizer);
        ticketing.createEvent("Test Event", 10 ether, 100, address(token), address(nft));

        (string memory name, address org, uint256 price, uint256 total, uint256 sold, address tokenAddr, address nftAddr) = 
            ticketing.events(1);

        assertEq(name, "Test Event");
        assertEq(org, organizer);
        assertEq(price, 10 ether);
        assertEq(total, 100);
        assertEq(sold, 0);
        assertEq(tokenAddr, address(token));
        assertEq(nftAddr, address(nft));
    }

    function testBuyTicket() public {
        vm.prank(organizer);
        ticketing.createEvent("Test Event", 10 ether, 100, address(token), address(nft));

        vm.prank(buyer);
        ticketing.buyTicket(1);

        assertEq(token.balanceOf(buyer), 90 ether);
        assertEq(token.balanceOf(organizer), 910 ether);
        assertEq(nft.ownerOf(1), buyer);
        assertEq(ticketing.events(1).ticketsSold, 1);
    }

    function testFailBuyTicketInsufficientBalance() public {
        vm.prank(organizer);
        ticketing.createEvent("Test Event", 200 ether, 100, address(token), address(nft));

        vm.prank(buyer);
        ticketing.buyTicket(1); // Should revert
    }

    function testFailBuyTicketInvalidEvent() public {
        vm.prank(buyer);
        ticketing.buyTicket(999); // Should revert
    }
}