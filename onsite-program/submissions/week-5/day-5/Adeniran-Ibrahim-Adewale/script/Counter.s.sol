// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EventTicketing.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        
        EventTicketing ticket = new EventTicketing();
        console.log("Ticket deployed to:", address(ticket));
        
        vm.stopBroadcast();
    }
}