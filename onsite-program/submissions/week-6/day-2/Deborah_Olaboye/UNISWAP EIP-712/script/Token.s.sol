// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {WolfToken} from "../src/Token.sol";

contract TokenScript is Script {
    WolfToken public wolf_token;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        wolf_token = new WolfToken();

        vm.stopBroadcast();
    }
}
