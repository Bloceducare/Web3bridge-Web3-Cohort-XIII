// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/SVG_NFT.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        
        vm.startBroadcast(deployerPrivateKey);
        
        SVG_NFT svgNFT = new SVG_NFT();
        
        vm.stopBroadcast();
        
        console.log("=== SVG_NFT Deployed ===");
        console.log("Contract Address:", address(svgNFT));
        console.log("Network: Sepolia");
        console.log("\nKey Fixes Applied:");
        console.log("1. Fixed Base64 encoding bug (no more corrupted characters)");
        console.log("2. Simplified SVG format for better Rarible compatibility");
        console.log("3. Standard metadata structure with attributes");
        console.log("\nNext steps:");
        console.log("1. Wait for deployment confirmation");
        console.log("2. Mint an NFT using: svgNFT.mint(your_address)");
        console.log("3. Try viewing on Rarible testnet");
        console.log("4. This should resolve the 'no metadata' issue!");
    }
}
