// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/SVG_NFT.sol";

contract Mint is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address contractAddress = vm.envAddress("CONTRACT_ADDRESS");
        
        SVG_NFT svgNFT = SVG_NFT(contractAddress);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Mint multiple NFTs to test indexing
        uint256 tokenId1 = svgNFT.mint(vm.addr(deployerPrivateKey));
        uint256 tokenId2 = svgNFT.mint(vm.addr(deployerPrivateKey));
        uint256 tokenId3 = svgNFT.mint(vm.addr(deployerPrivateKey));
        
        vm.stopBroadcast();
        
        console.log("=== Multiple NFTs Minted Successfully! ===");
        console.log("Contract Address:", contractAddress);
        console.log("Token ID 1:", tokenId1);
        console.log("Token ID 2:", tokenId2);
        console.log("Token ID 3:", tokenId3);
        console.log("Owner:", vm.addr(deployerPrivateKey));
        console.log("\nTo view on Rarible:");
        console.log("1. Go to https://testnet.rarible.com/");
        console.log("2. Connect your wallet (Sepolia testnet)");
        console.log("3. Go to your profile to see ALL 3 NFTs");
        console.log("4. Each NFT should display properly with dynamic SVG clock!");
        console.log("\nKey Benefits of Fixed Contract:");
        console.log("- Clean Base64 encoding (no corrupted characters)");
        console.log("- Simplified SVG for better marketplace compatibility");
        console.log("- Standard metadata structure with attributes");
        console.log("- All NFTs should index properly on Rarible");
    }
}
