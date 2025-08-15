// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/LootteryBox.sol";

contract DeployScript is Script {
    function run() external {
        string memory privateKeyStr = vm.envString("PRIVATE_KEY");
        
        if (bytes(privateKeyStr).length > 0 && bytes(privateKeyStr)[0] != '0') {
            privateKeyStr = string(abi.encodePacked("0x", privateKeyStr));
        }
        
        uint256 deployerPrivateKey = vm.parseUint(privateKeyStr);
        address deployer = vm.addr(deployerPrivateKey);
        
        uint256 subscriptionId = vm.envUint("VRF_SUBSCRIPTION_ID");
        address vrfCoordinator = vm.envAddress("VRF_COORDINATOR");
        bytes32 keyHash = vm.envBytes32("VRF_KEY_HASH");
        
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        console.log("VRF Coordinator:", vrfCoordinator);
        console.log("Subscription ID:", subscriptionId);
        
        vm.startBroadcast(deployerPrivateKey);
        
        LootteryBox lootBox = new LootteryBox(
            deployer,
            subscriptionId,
            vrfCoordinator,
            keyHash
        );
        
        console.log("LootteryBox deployed to:", address(lootBox));
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("LootteryBox address:", address(lootBox));
        console.log("Owner:", lootBox.owner());
        console.log("Initial box count:", lootBox.boxCount());
        console.log("Admin:", deployer);
    }
}