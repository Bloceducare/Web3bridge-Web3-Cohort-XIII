// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {UniswapPermit2Swap} from "../src/UniswapPermit2Swap.sol";

contract UniswapPermitSwapscript is Script {
    UniswapPermit2Swap public uniswapPermit2Swap;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        uniswapPermit2Swap = new UniswapPermit2Swap();

        vm.stopBroadcast();
    }
}
