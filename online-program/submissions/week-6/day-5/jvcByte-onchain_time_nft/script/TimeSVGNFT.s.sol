// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {TimeSVGNFT} from "../src/TimeSVGNFT.sol";

contract TimeSVGNFTScript is Script {
    TimeSVGNFT public timeSVGNFT;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        timeSVGNFT = new TimeSVGNFT();

        vm.stopBroadcast();
    }
}
