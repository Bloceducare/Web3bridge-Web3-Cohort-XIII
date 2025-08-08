// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/EventTicketing.sol";
import "../src/TicketToken.sol";
import "../src/TicketNft.sol";

contract EventTicketingTest is Test {
    EventTicketing public eventTicketing;
    TicketToken public ticketToken;
    TicketNft public ticketNft;
    
    address public owner;
    address public user1;
    address public user2;
    
    uint256 constant INITIAL_TOKEN_SUPPLY = 1000000 * 10**18;
    uint256 constant TICKET_PRICE = 100 * 10**18;
    uint256 constant TOTAL_TICKETS = 1000;

     function setUp() public {
        // Set up test accounts
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        // Deploy contracts
        eventTicketing = new EventTicketing();
        ticketToken = eventTicketing.ticketToken();
        ticketNft = eventTicketing.ticketNft();
        
        // Give some tokens to users for testing
        ticketToken.transfer(user1, 10000 * 10**18);
        ticketToken.transfer(user2, 5000 * 10**18);
        
        // Label addresses for better traces
        vm.label(address(eventTicketing), "EventTicketing");
        vm.label(address(ticketToken), "TicketToken");
        vm.label(address(ticketNft), "TicketNft");
        vm.label(user1, "User1");
        vm.label(user2, "User2");
    }

    
   
}