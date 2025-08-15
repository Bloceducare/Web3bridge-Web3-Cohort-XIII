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
        
        uint256 subscriptionId = vm.envUint("0x779877A7B0D9E8603169DdbD7836e478b4624789");
        address vrfCoordinator = vm.envAddress("0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B");
        bytes32 keyHash = vm.envBytes32("0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae");
        
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