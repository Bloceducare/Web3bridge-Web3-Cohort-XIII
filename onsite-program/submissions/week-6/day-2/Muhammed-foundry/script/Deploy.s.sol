// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {SwapWithPermit2} from "../src/SwapWithPermit2.sol";

contract DeployScript is Script {
    function run() external {
        // Start broadcasting transactions
        vm.startBroadcast();
        
        // Deploy contract
        SwapWithPermit2 swapContract = new SwapWithPermit2();
        
        console.log("SwapWithPermit2 deployed at:", address(swapContract));
        console.log("Permit2 address:", address(swapContract.PERMIT2()));
        console.log("Uniswap Router:", address(swapContract.UNISWAP_ROUTER()));
        console.log("DAI address:", swapContract.DAI());
        
        vm.stopBroadcast();
    }
}