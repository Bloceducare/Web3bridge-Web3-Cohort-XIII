// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";

contract VerifyScript is Script {
    function run() external view {
        console.log("=== Contract Verification ===");
        console.log("Deployment addresses from deployment.txt:");
        console.log("RolesRegistry=0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f");
        console.log("DAONFT=0x4A679253410272dd5232B3Ff7cF5dbB88f295319");
        console.log("DAO=0x7a2088a1bFc9d81c55368AE168C2C02570cB814F");
        console.log("Deployer=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
        console.log("GovernanceNFT_ID=0");
        
        console.log("\nTo verify contracts on Etherscan, use:");
        console.log("forge verify-contract <CONTRACT_ADDRESS> <CONTRACT_NAME> --chain-id <CHAIN_ID> --etherscan-api-key <API_KEY>");
        
        console.log("\nExample commands:");
        console.log("forge verify-contract <ROLES_REGISTRY_ADDRESS> src/RolesRegistry.sol:RolesRegistry --chain-id 31337 --etherscan-api-key dummy_key");
        console.log("forge verify-contract <DAONFT_ADDRESS> src/DAONFT.sol:DAONFT --chain-id 31337 --etherscan-api-key dummy_key");
        console.log("forge verify-contract <DAO_ADDRESS> src/DAO.sol:DAO --chain-id 31337 --etherscan-api-key dummy_key");
        
        console.log("\nNote: For local networks, verification may not be necessary.");
        console.log("The deployment.txt file contains all the information needed for local development.");
    }
} 