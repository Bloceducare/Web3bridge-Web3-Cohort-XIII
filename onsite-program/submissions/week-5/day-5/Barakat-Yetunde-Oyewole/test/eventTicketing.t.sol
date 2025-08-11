// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/eventTicketing.sol";

// testing the EventTicketing contract

contract EventTicketingTest is Test {
    ERC20Token public paymentToken;
    ERC721Token public ticketToken;
    EventTicketing public eventTicketing;

    address public buyer = address(0x123);
    uint256 public initialSupply = 1000 * 10 ** 18;

    function setUp() public {
        paymentToken = new ERC20Token(initialSupply);
        ticketToken = new ERC721Token();
        eventTicketing = new EventTicketing(paymentToken, ticketToken);

        // Transfer some tokens to the buyer
        paymentToken.transfer(buyer, initialSupply);
    }

    function testPurchaseTicket() public {
        vm.startPrank(buyer);
        
        // Approve the event ticketing contract to spend tokens
        paymentToken.approve(address(eventTicketing), 1 * 10 ** 18);
        
        // Purchase a ticket
        eventTicketing.purchaseTicket();
        
        // Check that the ticket was purchased
        assertEq(ticketToken.balanceOf(buyer), 1);
        
        // Check that the payment was made
        assertEq(paymentToken.balanceOf(address(eventTicketing)), 1 * 10 ** 18);
        
        vm.stopPrank();
    }

    function testWithdrawFunds() public {
    vm.startPrank(buyer);
    paymentToken.approve(address(eventTicketing), 1e18);
    eventTicketing.purchaseTicket();
    vm.stopPrank(); // ✅ stop acting as buyer

    // Withdraw as owner (this contract)
    uint256 before = paymentToken.balanceOf(address(this));
    eventTicketing.withdrawFunds();
    uint256 afterBal = paymentToken.balanceOf(address(this));

    assertEq(afterBal - before, 1e18);
}

}
