// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/EventFactory.sol";

contract DeployScript is Script {
    function run() external {
        // Get the deployer's private key from environment
        string memory privateKeyStr = vm.envString("PRIVATE_KEY");
        
        // Add 0x prefix if it doesn't exist
        if (bytes(privateKeyStr).length > 0 && bytes(privateKeyStr)[0] != '0') {
            privateKeyStr = string(abi.encodePacked("0x", privateKeyStr));
        }
        
        uint256 deployerPrivateKey = vm.parseUint(privateKeyStr);
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the EventFactory contract
        EventFactory factory = new EventFactory(deployer);
        
        console.log("EventFactory deployed to:", address(factory));
        
        vm.stopBroadcast();
        
        // Log deployment info
        console.log("\n=== Deployment Summary ===");
        console.log("EventFactory address:", address(factory));
        console.log("Owner:", factory.owner());
        console.log("Initial event count:", factory.getEventCount());
    }
}