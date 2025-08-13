// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/RolesRegistry.sol";
import "../src/DAONFT.sol";
import "../src/DAO.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy RolesRegistry first
        console.log("Deploying RolesRegistry...");
        RolesRegistry rolesRegistry = new RolesRegistry();
        console.log("RolesRegistry deployed at:", address(rolesRegistry));
        
        // Deploy DAONFT with RolesRegistry address
        console.log("Deploying DAONFT...");
        DAONFT daonft = new DAONFT("Governance NFT", "GOV", address(rolesRegistry));
        console.log("DAONFT deployed at:", address(daonft));
        
        // Deploy DAO with both addresses
        console.log("Deploying DAO...");
        DAO dao = new DAO(address(rolesRegistry), address(daonft));
        console.log("DAO deployed at:", address(dao));
        
        // Setup initial roles for the deployer
        console.log("Setting up initial roles...");
        
        // Grant PROPOSER_ROLE to deployer for token ID 0
        rolesRegistry.grantRole(dao.PROPOSER_ROLE(), vm.addr(deployerPrivateKey), 0);
        console.log("Granted PROPOSER_ROLE to deployer for token ID 0");
        
        // Grant VOTER_ROLE to deployer for token ID 0
        rolesRegistry.grantRole(dao.VOTER_ROLE(), vm.addr(deployerPrivateKey), 0);
        console.log("Granted VOTER_ROLE to deployer for token ID 0");
        
        // Grant EXECUTOR_ROLE to deployer for token ID 0
        rolesRegistry.grantRole(dao.EXECUTOR_ROLE(), vm.addr(deployerPrivateKey), 0);
        console.log("Granted EXECUTOR_ROLE to deployer for token ID 0");
        
        // Mint first governance NFT to deployer
        daonft.mint(vm.addr(deployerPrivateKey));
        console.log("Minted governance NFT #0 to deployer");
        
        // Register deployer as voter
        dao.registerAsVoter(0);
        console.log("Registered deployer as voter");
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("RolesRegistry:", address(rolesRegistry));
        console.log("DAONFT:", address(daonft));
        console.log("DAO:", address(dao));
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Governance NFT ID: 0");
        console.log("========================\n");
        
        // Save deployment addresses to a file for easy access
        string memory deploymentInfo = string.concat(
            "RolesRegistry=", vm.toString(address(rolesRegistry)), "\n",
            "DAONFT=", vm.toString(address(daonft)), "\n",
            "DAO=", vm.toString(address(dao)), "\n",
            "Deployer=", vm.toString(vm.addr(deployerPrivateKey)), "\n",
            "GovernanceNFT_ID=0\n"
        );
        
        console.log("Please save the deployment addresses above to deployment.txt manually");
    }
} 