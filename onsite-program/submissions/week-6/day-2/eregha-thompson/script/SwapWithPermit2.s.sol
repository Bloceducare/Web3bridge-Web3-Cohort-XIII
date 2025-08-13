// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "forge-std/Script.sol";
import "../src/UniswapV2SwapWithPermit2.sol";
import "../src/interfaces/IPermit2.sol";

contract SwapWithPermit2Script is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        UniswapV2SwapWithPermit2 swap = new UniswapV2SwapWithPermit2();
        console.log("Swap contract deployed at:", address(swap));

        vm.stopBroadcast();
    }
}
