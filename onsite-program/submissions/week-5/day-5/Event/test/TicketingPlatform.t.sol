// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/EventToken.sol";
import "../src/TicketNFT.sol";
import "../src/TicketingPlatform.sol";

contract TicketingPlatformTest is Test {
    EventToken token;
    TicketNFT ticketNFT;
    TicketingPlatform platform;
    address user = address(0x1);
    address owner = address(this);
    uint256 ticketPrice = 100 * 10**18; // 100 tokens

    function setUp() public {
        // Deploy contracts
        token = new EventToken(1000 * 10**18); // 1000 tokens initial supply
        ticketNFT = new TicketNFT("Test Event");
        platform = new TicketingPlatform(address(token), address(ticketNFT), ticketPrice);

        // Transfer tokens to user
        token.transfer(user, 500 * 10**18);
    }

    function testBuyTicket() public {
        // User approves tokens
        vm.prank(user);
        token.approve(address(platform), ticketPrice);

        // User buys ticket
        vm.prank(user);
        platform.buyTicket();

        // Verify NFT ownership
        assertEq(ticketNFT.ownerOf(1), user);
        // Verify token balance
        assertEq(token.balanceOf(user), 400 * 10**18);
        assertEq(token.balanceOf(address(platform)), ticketPrice);
    }

    function testFailInsufficientBalance() public {
        // Create a new user with no tokens
        address poorUser = address(0x2);
        vm.prank(poorUser);
        platform.buyTicket(); // Should fail
    }

    function testWithdrawTokens() public {
        // User buys ticket
        vm.prank(user);
        token.approve(address(platform), ticketPrice);
        vm.prank(user);
        platform.buyTicket();

        // Owner withdraws tokens
        uint256 initialBalance = token.balanceOf(owner);
        platform.withdrawTokens(ticketPrice);
        assertEq(token.balanceOf(owner), initialBalance + ticketPrice);
    }
}