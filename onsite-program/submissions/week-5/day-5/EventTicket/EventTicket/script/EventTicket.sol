// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {TicketItem} from "../src/TicketNft.sol";
import {EventTicket} from "../src/EventTicket.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy TicketItem contract
        TicketItem ticketItem = new TicketItem();

        // Deploy EventTicket contract, passing TicketItem address to constructor
        EventTicket eventTicket = new EventTicket(address(ticketItem));

        vm.stopBroadcast();
    }
}
