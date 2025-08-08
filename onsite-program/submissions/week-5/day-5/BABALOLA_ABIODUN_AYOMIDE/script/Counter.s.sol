// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {EventTicketSystem} from "../src/EventTicketSystem.sol";

contract EventTicketSystemScript is Script {
    EventTicketSystem public eventTicketSystem;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        eventTicketSystem = new EventTicketSystem();
        vm.stopBroadcast();
    }
}
