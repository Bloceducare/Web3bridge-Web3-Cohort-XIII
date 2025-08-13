// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/PermitAndSwap.sol";

contract DeployPermitAndSwap is Script {
    address constant UNISWAP_V2_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address constant PERMIT2_ADDRESS = 0x000000000022D473030F116dDEE9F6B43aC78BA3;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        PermitAndSwap swapContract = new PermitAndSwap(
            PERMIT2_ADDRESS,
            UNISWAP_V2_ROUTER
        );

        vm.stopBroadcast();

        console.log("PermitAndSwap deployed at:", address(swapContract));
    }
}
