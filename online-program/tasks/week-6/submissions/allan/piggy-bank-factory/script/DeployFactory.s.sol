// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/PiggyBankFactory.sol";

/**
 * @title DeployFactory
 * @dev Deployment script for PiggyBankFactory contract only
 * @author Allan Kamau - Web3bridge Week 6 Assignment
 */
contract DeployFactory is Script {
    function run() external returns (PiggyBankFactory) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying PiggyBankFactory...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy PiggyBankFactory
        PiggyBankFactory factory = new PiggyBankFactory();

        vm.stopBroadcast();

        // Verify deployment
        require(factory.admin() == deployer, "Admin not set correctly");
        require(factory.totalPiggyBanks() == 0, "Initial piggy bank count should be 0");

        console.log("\n=== DEPLOYMENT SUCCESSFUL ===");
        console.log("PiggyBankFactory deployed at:", address(factory));
        console.log("Factory admin:", factory.admin());
        console.log("Initial piggy bank count:", factory.totalPiggyBanks());
        console.log("============================");

        return factory;
    }
}
