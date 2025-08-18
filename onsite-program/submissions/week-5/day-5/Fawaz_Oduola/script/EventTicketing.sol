// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {EventTicketing} from "../src/EventTicketing.sol";
import {TicketToken} from "../src/TicketToken.sol";
import {TicketNft} from "../src/TicketNft.sol";

contract CounterScript is Script {
    EventTicketing public eventTicketing;
    TicketNft public ticketNft;
    TicketToken public ticketToken;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        ticketToken = new TicketToken(1000000000000000);
        ticketNft = new TicketNft();
        eventTicketing = new EventTicketing(address(ticketNft), address(ticketToken), 100, 50);

        console.log("Deployed ticketToken at:", address(ticketToken));
        console.log("Deployed ticketNft at:", address(ticketNft));
        console.log("Deployed eventTicketing at:", address(eventTicketing));
        vm.stopBroadcast();
    }
}
