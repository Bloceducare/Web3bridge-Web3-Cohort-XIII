// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {EventTicketing} from "../src/EventTicketing.sol";

contract EventTicketingTest is Test {

    EventTicketing public eventTicketing;

    function setUp() public {
        eventTicketing = new EventTicketing();

    }
    function test_createTcket() public {
        // eventTicketing.setTicketId(_ticketId);
        // eventTicketing.setName(_name);
        // eventTicketing.setTicketPrice(_ticketPrice);
        // eventTicketing.setTicketType(_ticketType.RARE);
        // eventTicketing.setStatus(_status.ONGOING);



        // assertEq();

    }

        
    // Counter public counter;

    // function setUp() public {
    //     counter = new Counter();
    //     counter.setNumber(0);
    // }

    // function test_Increment() public {
    //     counter.increment();
    //     assertEq(counter.number(), 1);
    // }

    // function testFuzz_SetNumber(uint256 x) public {
    //     counter.setNumber(x);
    //     assertEq(counter.number(), x);
    // }
}
