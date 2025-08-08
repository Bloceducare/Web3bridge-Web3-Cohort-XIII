// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {EventTicketSystem} from "../src/EventTicketSystem.sol";

contract EventTicketSystemTest is Test {
    EventTicketSystem public eventSystem;
    string private eventName;
    uint private  ticketsUnit;

    function setUp() public {
        eventSystem = new EventTicketSystem();
    }

    function testsNumberOfTicketsForEventsCanBeGotten() public {
        eventName= "event101";
        ticketsUnit = 20;
        eventSystem.createTickets(eventName, ticketsUnit);
        assertEq(eventSystem.getEventsTotalTicket(eventName), ticketsUnit);
    }

    function testsUsersCanButEventTicket()public {
        testsNumberOfTicketsForEventsCanBeGotten();
        address user101 = address(0x123456);
        vm.prank(user101);
        uint quantity = 5;
        uint ticketPrice = eventSystem.getEventTicketPrice(eventName);
        eventSystem.purchaseTicket(quantity);

    }

}
