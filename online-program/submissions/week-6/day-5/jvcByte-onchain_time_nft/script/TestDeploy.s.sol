// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TimeSVGNFT} from "../src/TimeSVGNFT.sol";

// Test version of TimeSVGNFT that uses _mint instead of _safeMint
contract TestTimeSVGNFT is TimeSVGNFT {
    function safeMint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}

contract TestDeploy is Script {
    function run() external {
        // Get deployer address from private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer address:", deployer);
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the test version of the contract
        console.log("Deploying TestTimeSVGNFT...");
        TestTimeSVGNFT timeNFT = new TestTimeSVGNFT();
        
        // Log the deployed contract address
        console.log("TimeSVGNFT deployed to:", address(timeNFT));
        
        // Test minting an NFT - using the contract's owner (deployer) to avoid safeTransferFrom checks
        address testAddress = vm.envAddress("TEST_ADDRESS");
        console.log("Minting NFT to:", testAddress);
        
        // Mint directly to test address using safeMint (which uses _mint under the hood)
        uint256 tokenId = 1; // We know this will be the first token
        timeNFT.safeMint(testAddress, tokenId);
        console.log("Minted token ID:", tokenId, "to:", testAddress);
        
        // Test tokenURI
        console.log("Fetching token URI...");
        string memory uri = timeNFT.tokenURI(tokenId);
        console.log("Token URI:", uri);
        
        // Additional test: Check owner of the token
        console.log("Owner of token", tokenId, ":", timeNFT.ownerOf(tokenId));
        
        vm.stopBroadcast();
    }
}
