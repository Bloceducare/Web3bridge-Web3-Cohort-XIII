// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "../src/EventNFT.sol";
import "../src/EventTicketSystem.sol";
import "../src/EventToken.sol";
import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";

contract EventTicketSystemTest is Test {
    EventTicketSystem public eventSystem;
    string private eventName;
    uint private  ticketsUnit;
    EventToken private token;
    EventNFT private nft;
    address user;

    function setUp() public {
        user = address(0x9198389);
        vm.prank(user);
        token = new EventToken(100);
        nft = new EventNFT();
        eventSystem = new EventTicketSystem(address(token), address(nft));
    }

    function testsNumberOfTicketsForEventsCanBeGotten() public {
        eventName= "event101";
        ticketsUnit = 20;
        eventSystem.createTickets(eventName, ticketsUnit,10);
        assertEq(eventSystem.getEventsTotalTicket(eventName), ticketsUnit);
    }

    function testsUsersCanBuyEventTicket()public {
        testsNumberOfTicketsForEventsCanBeGotten();
        address user101 = address(0x123456);
        vm.prank(user);
        token.transfer(user101,1000);
        vm.prank(user101);
        token.approve(address(eventSystem), 10);
        vm.prank(user101);
        eventSystem.purchaseTicket("event101");
        bool hasToken = eventSystem.isHoldingNFT(user101);
        assertTrue(hasToken);
        assertEq(19,eventSystem.getEventsTicketsLeft("event101"));
        assertEq(1,nft.balanceOf(user101));
    }

}
