// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PaymentToken.sol";
import "../src/TicketNFT.sol";
import "../src/EventManager.sol";

contract EventSystemTest is Test {
    PaymentToken paymentToken;
    TicketNFT ticketNFT;
    EventManager eventManager;
    
    address user1 = address(0x123);
    address user2 = address(0x456);

    function setUp() public {
        paymentToken = new PaymentToken();
        ticketNFT = new TicketNFT();
        eventManager = new EventManager(address(paymentToken), address(ticketNFT));
        
        // Transfer NFT ownership to EventManager
        ticketNFT.transferOwnership(address(eventManager));
        
        // Give users tokens
        paymentToken.mint(user1, 1000 * 10**18);
        paymentToken.mint(user2, 1000 * 10**18);
    }

    function testBuyTicket() public {
        // User1 approves tokens and buys ticket
        vm.prank(user1);
        paymentToken.approve(address(eventManager), 100 * 10**18);
        
        vm.prank(user1);
        eventManager.buyTicket(100 * 10**18);
        
        // Check user1 has ticket
        assertEq(ticketNFT.balanceOf(user1), 1);
        assertEq(eventManager.hasTicket(user1), true);
    }

    function testEndEventAndReveal() public {
        // Buy ticket first
        vm.prank(user1);
        paymentToken.approve(address(eventManager), 100 * 10**18);
        vm.prank(user1);
        eventManager.buyTicket(100 * 10**18);
        
        // End event and reveal
        eventManager.endEvent();
        eventManager.revealTickets();
        
        assertEq(ticketNFT.revealed(), true);
    }

    function testGetAllTicketInfo() public {
        // Buy tickets
        vm.prank(user1);
        paymentToken.approve(address(eventManager), 100 * 10**18);
        vm.prank(user1);
        eventManager.buyTicket(100 * 10**18);
        
        vm.prank(user2);
        paymentToken.approve(address(eventManager), 150 * 10**18);
        vm.prank(user2);
        eventManager.buyTicket(150 * 10**18);
        
        // Check all ticket info
        (uint256 total, address[] memory buyers, uint256[] memory prices) = eventManager.getAllTicketInfo();
        
        assertEq(total, 2);
        assertEq(buyers[0], user1);
        assertEq(buyers[1], user2);
        assertEq(prices[0], 100 * 10**18);
        assertEq(prices[1], 150 * 10**18);
    }
}