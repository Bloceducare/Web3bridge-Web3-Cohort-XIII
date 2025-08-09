// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {EventTicketing} from "../src/EventTicketing.sol";
import {TicketNft} from "../src/TicketNft.sol";
import {TicketToken} from "../src/TicketToken.sol";

contract CounterScript is Script {
    EventTicketing public eventTicketing;
    TicketNft public ticketNft;
    TicketToken public ticketToken;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        
        ticketNft = new TicketNft();
        ticketToken = new TicketToken(10000);
        eventTicketing = new EventTicketing(address(ticketNft),address(ticketToken));

        console.log("Deployed at ", address(ticketNft));
        console.log("Deployed at ", address(ticketToken));
        console.log("Deployed at ", address(eventTicketing));

        vm.stopBroadcast();
    }
}
