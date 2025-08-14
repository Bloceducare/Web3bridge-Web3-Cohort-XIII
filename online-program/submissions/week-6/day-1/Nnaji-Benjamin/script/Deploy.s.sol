// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/PiggyBankFactory.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the factory
        PiggyBankFactory factory = new PiggyBankFactory();
        
        console.log("=== Deployment Complete ===");
        console.log("PiggyBankFactory deployed to:", address(factory));
        console.log("Factory Owner:", factory.owner());
        console.log("Chain ID:", block.chainid);
        
        vm.stopBroadcast();
        
        // Log deployment info for easy access
        console.log("\n=== Contract Verification ===");
        console.log("To verify on Lisk Sepolia:");
        console.log("forge verify-contract", vm.toString(address(factory)));
        console.log("src/PiggyBankFactory.sol:PiggyBankFactory");
        console.log("--chain lisk_sepolia");
    }
}