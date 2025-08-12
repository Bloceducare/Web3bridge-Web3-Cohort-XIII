// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {PermitSwap} from "../src/uniswap.sol";

contract PermitSwapScript is Script {
    PermitSwap public permitSwap;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        address swapRouter = 0xE592427A0AEce92De3Edee1F18E0157C05861564; // Uniswap V3 SwapRouter on mainnet
        permitSwap = new PermitSwap(swapRouter);

        vm.stopBroadcast();
    }
}
