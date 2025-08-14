// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {LootBox} from "../src/LootBox.sol";

contract DeployLootBoxFullID is Script {
    function run() external returns (LootBox) {
        // VRF v2.5 Configuration for Sepolia with FULL subscription ID
        address vrfCoordinator = 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B; // Your VRF v2.5 Coordinator
        uint256 subscriptionId = 36833720110440505129669520883805093522309645231072362901197781412609068399525; // FULL subscription ID
        bytes32 keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae; // Your Sepolia Key Hash
        
        vm.startBroadcast();
        LootBox lb = new LootBox(
            vrfCoordinator,
            subscriptionId,
            keyHash
        );
        vm.stopBroadcast();
        
        return lb;
    }
}
