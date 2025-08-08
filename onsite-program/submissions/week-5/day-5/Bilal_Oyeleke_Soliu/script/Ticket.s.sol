// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {EventFactory} from "src/TIcketSFTFactory.sol";

contract DeployEventFactory is Script {
    EventFactory public factory;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        factory = new EventFactory(msg.sender);
        console.log("EventFactory deployed at:", address(factory));

        vm.stopBroadcast();
    }
}
