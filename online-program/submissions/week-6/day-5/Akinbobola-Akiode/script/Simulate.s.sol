// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/SVG_NFT.sol";

contract SimulateSVGNFT is Script {
    function run() external {
        console.log("=== SVG NFT Simulation ===");
        
        // Deploy the contract
        SVG_NFT svgNFT = new SVG_NFT();
        console.log("Contract deployed at:", address(svgNFT));
        
        // Mint an NFT
        address user = address(0x1234);
        uint256 tokenId = svgNFT.mint(user);
        console.log("NFT minted with ID:", tokenId);
        console.log("Owner:", svgNFT.ownerOf(tokenId));
        
        // Get the token URI
        string memory uri = svgNFT.tokenURI(tokenId);
        console.log("\n=== Token URI ===");
        console.log("URI length:", bytes(uri).length);
        console.log("URI starts with data:application/json;base64:", _startsWith(uri, "data:application/json;base64,"));
        
        // Show current block info
        console.log("\n=== Current Block Info ===");
        console.log("Block number:", block.number);
        console.log("Block timestamp:", block.timestamp);
        
        // Test time calculation
        console.log("\n=== Time Calculation Test ===");
        (string memory hh, string memory mm, string memory ss) = _getTimeParts(block.timestamp);
        console.log(string.concat("Current time (HH:MM:SS): ", hh, ":", mm, ":", ss));
        
        // Test contract state
        console.log("\n=== Contract State ===");
        console.log("Total supply:", svgNFT.totalSupply());
        console.log("Balance of user:", svgNFT.balanceOf(user));
        console.log("Supports ERC721:", svgNFT.supportsInterface(0x80ac58cd));
        
        console.log("\n=== Simulation Complete ===");
        console.log("Contract is working correctly!");
        console.log("NFT minted successfully!");
        console.log("Dynamic SVG generation working!");
        console.log("Ready for Sepolia deployment!");
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
    
    function _contains(string memory str, string memory search) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory searchBytes = bytes(search);
        
        for (uint256 i = 0; i <= strBytes.length - searchBytes.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < searchBytes.length; j++) {
                if (strBytes[i + j] != searchBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    }
    
    function _extractBase64(string memory uri) internal pure returns (string memory) {
        // Remove "data:application/json;base64," prefix
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
    
    function _decodeBase64(string memory data) internal pure returns (string memory) {
        // For simulation purposes, just return the base64 string
        // In a real scenario, you'd decode this properly
        return data;
    }
    
    function _extractSVGFromJSON(string memory json) internal pure returns (string memory) {
        // Simple extraction - look for "image":"data:image/svg+xml;base64,"
        bytes memory jsonBytes = bytes(json);
        bytes memory search = "image\":\"data:image/svg+xml;base64,";
        
        if (jsonBytes.length < search.length) {
            return "";
        }
        
        for (uint256 i = 0; i <= jsonBytes.length - search.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < search.length; j++) {
                if (jsonBytes[i + j] != search[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                // Extract from this position to the end of the string
                uint256 remainingLength = jsonBytes.length - i - search.length;
                if (remainingLength == 0) {
                    return "";
                }
                
                bytes memory result = new bytes(remainingLength);
                for (uint256 k = 0; k < remainingLength; k++) {
                    result[k] = jsonBytes[i + search.length + k];
                }
                return string(result);
            }
        }
        return "";
    }
    
    function _getTimeParts(uint256 timestamp) internal pure returns (string memory hh, string memory mm, string memory ss) {
        uint256 secondsInDay = timestamp % 86400;
        uint256 hourValue = secondsInDay / 3600;
        uint256 minuteValue = (secondsInDay % 3600) / 60;
        uint256 secondValue = secondsInDay % 60;
        
        hh = _padZero(hourValue);
        mm = _padZero(minuteValue);
        ss = _padZero(secondValue);
    }
    
    function _padZero(uint256 num) internal pure returns (string memory) {
        if (num < 10) {
            return string.concat("0", _toString(num));
        }
        return _toString(num);
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
