// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {AccessSystem} from "../src/AccessSystem.sol";

contract AccessSystemScript is Script {
    AccessSystem public accessSystem;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        accessSystem = new AccessSystem();

        vm.stopBroadcast();
    }
}
