// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/PiggyBankFactory.sol";
import "../src/MockERC20.sol";

/**
 * @title Deploy
 * @dev Deployment script for PiggyBankFactory and MockERC20 contracts
 * @author Allan Kamau - Web3bridge Week 6 Assignment
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy PiggyBankFactory
        PiggyBankFactory factory = new PiggyBankFactory();
        console.log("PiggyBankFactory deployed at:", address(factory));
        console.log("Factory admin:", factory.admin());

        // Deploy MockERC20 for testing (optional)
        MockERC20 testToken = new MockERC20(
            "Test Token",
            "TEST",
            18,
            1000000 // 1M tokens initial supply
        );
        console.log("MockERC20 deployed at:", address(testToken));
        console.log("Test token total supply:", testToken.totalSupply());

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network: ", block.chainid);
        console.log("Block number: ", block.number);
        console.log("Deployer: ", vm.addr(deployerPrivateKey));
        console.log("PiggyBankFactory: ", address(factory));
        console.log("MockERC20: ", address(testToken));
        console.log("========================");
    }
}
