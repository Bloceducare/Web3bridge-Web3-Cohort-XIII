// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {ClockSVG} from "../src/SVG.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        ClockSVG clock = new ClockSVG();
        // mint one to the deployer as a demo
        clock.mint(vm.addr(deployerKey));
        vm.stopBroadcast();

        console2.log("ClockSVG deployed at:", address(clock));
    }
}
