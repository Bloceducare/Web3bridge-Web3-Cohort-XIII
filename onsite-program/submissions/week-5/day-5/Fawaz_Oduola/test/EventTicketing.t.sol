// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {EventTicketing} from "../src/EventTicketing.sol";
import {TicketNft} from "../src/TicketNft.sol";
import {TicketToken} from "../src/TicketToken.sol";

contract CounterTest is Test {
    EventTicketing public eventTicketing;
    TicketNft public ticketNft;
    TicketToken public ticketToken;
    uint256 totalNumberOfTickets = 100;

    function setUp() public {
        ticketToken = new TicketToken(1000000000000000);
        ticketNft = new TicketNft();
        eventTicketing = new EventTicketing(address(ticketNft) , address(ticketToken), 100, totalNumberOfTickets);
       
    }

    function test_buy_token() public {
        
        uint256 initialBalance  = ticketToken.balanceOf(address(this));
        eventTicketing.buyToken();
        uint256 balance = ticketToken.balanceOf(address(this));
        
        assertEq(balance-initialBalance, 1000);
    }

    function test_buy_ticket() public {
        eventTicketing.buyToken();
        // console.log(ticketToken.balanceOf(address(this)));
        // console.log(vm.addr(0));
        ticketToken.approve(address(eventTicketing), 1000); //approve the contract to withdraw token
        eventTicketing.buyTicket();
       
        address buyer = ticketNft.ownerOf(eventTicketing.buyTicket());
        // console.log(ticketToken.balanceOf(address(this)));
        assertEq(buyer, address(this));

    }

    function test_buyTicket_reverts_when_ticketFinish() public {
        
        for(uint256 i; i < totalNumberOfTickets; i++){
            ticketToken.approve(address(eventTicketing), 1000);
            eventTicketing.buyTicket();
        }
        vm.expectRevert();
        eventTicketing.buyTicket();
    }
}
