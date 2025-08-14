// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {EventTicketing} from "../src/EventTicketing.sol";


contract EventTicketingTest is Test {
    EventTicketing eventTicketing;

    function setUp() public {
        eventTicketing = new EventTicketing("Web3Lagos", "Gbagada", 100);
    }

    function testInitialSetUp() public view {
        
        assertEq(eventTicketing.get_event_name(), "Web3Lagos");
        assertEq(eventTicketing.get_event_venue(), "Gbagada");
        assertEq(eventTicketing.get_max_ticket(), 100);
    }

    function testCreateTicket() public {

      eventTicketing.create_ticket(1, 5, "Gbagada");

      assertEq(eventTicketing.get_ticket().id, 1);
      assertEq(eventTicketing.get_ticket().ticket_price, 5);
      assertEq(eventTicketing.get_ticket().venue, "Gbagada");
      
    }

    function testBuyTicket() public {

      eventTicketing.create_ticket(1, 4, "Gbagada");
      
      eventTicketing.set_balance(20);

      eventTicketing.buy_ticket(5);

      assertEq(eventTicketing.get_max_ticket(), 95);

      assertEq(eventTicketing.get_balance(), 0);

    }
  
}
