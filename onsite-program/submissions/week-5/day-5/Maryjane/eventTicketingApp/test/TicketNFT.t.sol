// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/TicketNFT.sol";

contract TicketNFTTest is Test {
    TicketNFT ticketNFT;
    address user = address(1);

    function setUp() public {
        ticketNFT = new TicketNFT();
    }

    function testCreateEvent() public {
        uint256 eventId = ticketNFT.createEvent("Web3 Conference", block.timestamp + 1 days, 100);
        (string memory name, , uint256 maxTickets, , bool active) = ticketNFT.events(eventId);
        assertEq(name, "Web3 Conference");
        assertEq(maxTickets, 100);
        assertTrue(active);
    }

    function testMintTicket() public {
        uint256 eventId = ticketNFT.createEvent("Music Fest", block.timestamp + 1 days, 5);
        vm.prank(user);
        uint256 tokenId = ticketNFT.mintTicket(eventId);

        assertEq(ticketNFT.ownerOf(tokenId), user);
        assertEq(ticketNFT.tokenEventId(tokenId), eventId);
    }

    function testBurnTicket() public {
        uint256 eventId = ticketNFT.createEvent("Hackathon", block.timestamp + 1 days, 5);
        vm.prank(user);
        uint256 tokenId = ticketNFT.mintTicket(eventId);

        vm.prank(user);
        ticketNFT.burnTicket(tokenId);

        // Check token no longer exists
        vm.expectRevert("ERC721: invalid token ID");
        ticketNFT.ownerOf(tokenId);
    }
}
