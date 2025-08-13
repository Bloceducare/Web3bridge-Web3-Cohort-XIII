// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SwapHelper.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        address permit2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
        address uniswapV2Router = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

        SwapHelper swapHelper = new SwapHelper(permit2, uniswapV2Router);

        console.log("SwapHelper deployed to:", address(swapHelper));

        vm.stopBroadcast();
    }
}