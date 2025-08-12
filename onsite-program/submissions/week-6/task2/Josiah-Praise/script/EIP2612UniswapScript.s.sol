// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "src/PermitSwap.sol";

contract PermitSwapScript is Script {
    function run() external {
        vm.startBroadcast();

        PermitSwap permitSwap = new PermitSwap(
            0x000000000022D473030F116dDEE9F6B43aC78BA3,
            0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
        );

        console2.log("PermitSwap deployed at:", address(permitSwap));

        vm.stopBroadcast();
    }
}
