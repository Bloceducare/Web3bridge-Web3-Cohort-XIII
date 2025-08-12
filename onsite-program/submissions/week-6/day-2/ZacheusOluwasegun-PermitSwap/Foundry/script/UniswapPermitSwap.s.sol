// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {UniswapPermit1Swap} from "../src/UniswapPermitSwap.sol";

contract UniswapPermitSwapscript is Script {
    UniswapPermit1Swap public uniswapPermit1Swap;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        uniswapPermit1Swap = new UniswapPermit1Swap();

        vm.stopBroadcast();
    }
}
