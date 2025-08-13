// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {PermitSwapV3} from "../src/PermitSwapV3.sol";
import "forge-std/console.sol";
import "forge-std/Script.sol";

contract Deploy is Script {
    function run() external {
        address deployer = msg.sender;
        vm.startBroadcast();
        address permit2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
        address swapRouter = 0xE592427A0AEce92De3Edee1F18E0157C05861564; // Uniswap V3
        PermitSwapV3 permitSwapV3 = new PermitSwapV3(permit2, swapRouter);
        vm.stopBroadcast();
        console.log("Deployer:", deployer);
        console.log("PermitSwapV3 deployed to:", address(permitSwapV3));
    }
}