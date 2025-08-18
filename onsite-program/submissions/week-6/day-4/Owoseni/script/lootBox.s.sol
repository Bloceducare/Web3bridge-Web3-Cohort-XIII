// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/LootBox.sol";

contract DeployLootBox is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        uint64 subscriptionId = uint64(vm.envUint("SUBSCRIPTION_ID"));
        LootBox lootBox = new LootBox(subscriptionId);
        console.log("LootBox deployed to:", address(lootBox));

        vm.stopBroadcast();
    }
}
