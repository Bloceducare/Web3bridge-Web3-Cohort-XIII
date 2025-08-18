// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {PiggyFactory} from "../src/piggyFactory.sol";

contract CounterScript is Script {
    PiggyFactory public piggyFactory;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        piggyFactory = new PiggyFactory();

        vm.stopBroadcast();
    }
}
