// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {EventTicketing} from "../src/EventTicketing.sol";
import {EventTicketNft} from "../src/TicketNft.sol";
import {EventTicketToken} from "../src/TicketToken.sol";

contract EventTicketingScript is Script {
    
    function run() external {
        vm.startBroadcast();

        
        EventTicketNft ticketNft = new EventTicketNft();

        EventTicketToken ticketToken = new EventTicketToken(1000 * 10**18);

        EventTicketing eventTicketing = new EventTicketing(
            0.1 ether,
            10,
            1000 * 10**18,
            address(ticketNft),
            address(ticketToken)
        );

        ticketToken.transfer(address(eventTicketing), 1000 * 10**18);

        vm.stopBroadcast();
    }
}