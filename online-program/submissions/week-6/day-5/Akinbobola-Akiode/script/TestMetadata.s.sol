// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/SVG_NFT.sol";

contract TestMetadata is Script {
    function run() external {
        // The deployed contract address on Sepolia
        address contractAddress = 0x80b1DDCFeffF50762638B7a676E806990428A0d1;
        SVG_NFT svgNFT = SVG_NFT(contractAddress);
        
        console.log("=== Testing NFT Metadata ===");
        console.log("Contract:", contractAddress);
        
        // Test tokenURI for token #1
        try svgNFT.tokenURI(1) returns (string memory uri) {
            console.log("\n=== Token URI Success ===");
            console.log("URI length:", bytes(uri).length);
            console.log("URI starts with data:application/json;base64:", _startsWith(uri, "data:application/json;base64,"));
            
            // Extract the base64 part
            string memory base64Data = _extractBase64(uri);
            console.log("Base64 data length:", bytes(base64Data).length);
            console.log("First 100 chars of base64:", _substring(base64Data, 0, 100));
            
        } catch Error(string memory reason) {
            console.log("Error calling tokenURI:", reason);
        } catch {
            console.log("Unknown error calling tokenURI");
        }
        
        // Test contract state
        console.log("\n=== Contract State ===");
        console.log("Total supply:", svgNFT.totalSupply());
        console.log("Owner of token 1:", svgNFT.ownerOf(1));
        console.log("Balance of owner:", svgNFT.balanceOf(svgNFT.ownerOf(1)));
        
        console.log("\n=== Next Steps ===");
        console.log("1. Wait for Etherscan verification to complete");
        console.log("2. Check: https://sepolia.etherscan.io/address/0x80b1ddcfefff50762638b7a676e806990428a0d1");
        console.log("3. Once verified, Rarible should be able to read the metadata");
    }
    
    function _startsWith(string memory str, string memory prefix) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory prefixBytes = bytes(prefix);
        
        if (prefixBytes.length > strBytes.length) return false;
        
        for (uint256 i = 0; i < prefixBytes.length; i++) {
            if (strBytes[i] != prefixBytes[i]) return false;
        }
        return true;
    }
    
    function _extractBase64(string memory uri) internal pure returns (string memory) {
        bytes memory uriBytes = bytes(uri);
        bytes memory prefix = "data:application/json;base64,";
        
        if (uriBytes.length <= prefix.length) {
            return "";
        }
        
        bytes memory result = new bytes(uriBytes.length - prefix.length);
        
        for (uint256 i = prefix.length; i < uriBytes.length; i++) {
            result[i - prefix.length] = uriBytes[i];
        }
        
        return string(result);
    }
    
    function _substring(string memory str, uint256 startIndex, uint256 endIndex) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        
        if (startIndex >= strBytes.length) return "";
        if (endIndex > strBytes.length) endIndex = strBytes.length;
        if (startIndex >= endIndex) return "";
        
        bytes memory result = new bytes(endIndex - startIndex);
        
        for (uint256 i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        
        return string(result);
    }
}
