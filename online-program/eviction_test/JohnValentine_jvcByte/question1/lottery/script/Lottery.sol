// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Lottery} from "../src/Lottery.sol";

contract DeployLottery is Script {
    Lottery public lottery;

    function setUp() public {
        
    }

    function run() external {
        vm.startBroadcast();
        lottery = new Lottery();
        vm.stopBroadcast();

        // Verify deployment
        console.log("Lottery deployed at:", address(lottery));

        // Add contract address to readme (manual step, not automated here)
        // Example: echo "Lottery address: $(address lottery)" >> ../README.md
    }

    function interact() external {
        vm.startBroadcast();
        lottery = Lottery(payable(lottery)); // Replace with actual address
        for (uint i = 0; i < 10; i++) {
            address player = address(uint160(i + 1));
            vm.prank(player);
            lottery.join{value: 0.01 ether}();
        }
        vm.stopBroadcast();

        // Deploy again to confirm reset
        lottery = new Lottery();
        console.log("New Lottery deployed at:", address(lottery));
    }
}
