// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "src/PermitSwap.sol";

contract DeployPermitSwap is Script {
    address constant UNISWAP_V2_ROUTER =
        0x0000000000000000000000000000000000000000;

    function run() external {
        vm.startBroadcast();
        PermitSwap swapContract = new PermitSwap(UNISWAP_V2_ROUTER);
        console2.log("PermitSwap deployed at:", address(swapContract));
        vm.stopBroadcast();
    }
}
