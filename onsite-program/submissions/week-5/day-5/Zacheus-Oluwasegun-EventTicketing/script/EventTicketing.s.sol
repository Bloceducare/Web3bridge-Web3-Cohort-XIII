// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {EventTicketing} from "../src/EventTicket.sol";
import {TicketNFT} from "../src/TicketNft.sol";
import {TicketToken} from "../src/TicketToken.sol";

contract CounterScript is Script {
    EventTicketing public eventTicketing;
    TicketNFT public ticketNFT;
    TicketToken public ticketToken;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        ticketNFT = new TicketNFT();

        vm.stopBroadcast();

        vm.startBroadcast();

        ticketToken = new TicketToken(1_000_000);

        vm.stopBroadcast();

        vm.startBroadcast();

        eventTicketing = new EventTicketing(address(ticketNFT), address(ticketToken),"Shopla", 400, 20);

        vm.stopBroadcast();
    }
}
