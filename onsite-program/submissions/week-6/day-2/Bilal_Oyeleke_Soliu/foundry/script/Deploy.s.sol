// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {SwapWithPermit} from "../src/SwapWithPermit.sol";
import {MockERC20Permit} from "../src/MockERC20Permit.sol";
import {MockUniswapRouter} from "../src/MockUniswapRouter.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        MockERC20Permit tokenA = new MockERC20Permit("Token A", "TKNA", 18);
        MockERC20Permit tokenB = new MockERC20Permit("Token B", "TKNB", 18);
        MockUniswapRouter router = new MockUniswapRouter();
        SwapWithPermit swapContract = new SwapWithPermit(address(router));
        
        vm.stopBroadcast();
    }
}