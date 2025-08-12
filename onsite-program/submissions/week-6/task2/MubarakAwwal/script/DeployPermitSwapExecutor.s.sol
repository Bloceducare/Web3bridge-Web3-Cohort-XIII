// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PermitSwapExecutor.sol";

contract DeployPermitSwapExecutor is Script {
    function run() external returns (PermitSwapExecutor) {
        vm.startBroadcast();
        PermitSwapExecutor contractInstance = new PermitSwapExecutor(
            0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D // example: Uniswap V2 Router address
        );
        vm.stopBroadcast();
        return contractInstance;
    }
}

