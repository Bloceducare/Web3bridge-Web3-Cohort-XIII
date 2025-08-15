// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/SVG_NFT.sol";

contract MintNFT is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // The deployed contract address on Sepolia
        address contractAddress = 0x80b1DDCFeffF50762638B7a676E806990428A0d1;
        SVG_NFT svgNFT = SVG_NFT(contractAddress);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Mint an NFT to your address
        uint256 tokenId = svgNFT.mint(vm.addr(deployerPrivateKey));
        
        vm.stopBroadcast();
        
        console.log("NFT minted successfully!");
        console.log("Token ID:", tokenId);
        console.log("Owner:", vm.addr(deployerPrivateKey));
        console.log("Contract:", contractAddress);
        console.log("\nTo view on Rarible:");
        console.log("1. Go to https://testnet.rarible.com/");
        console.log("2. Connect your wallet (Sepolia testnet)");
        console.log("3. Go to your profile to see the NFT");
        console.log("4. Click on the NFT to see the dynamic SVG clock!");
    }
}
