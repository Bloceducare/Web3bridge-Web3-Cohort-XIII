// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {Base64} from "./Base64.sol";

contract DynamicTimeSVGNFT is ERC721, Ownable {
    using Strings for uint256;
    
    uint256 private _tokenIdCounter;
    
    constructor() ERC721("Dynamic Time NFT", "TIME") Ownable(msg.sender) {}
    
    function mint() public onlyOwner {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(msg.sender, tokenId);
    }
    
    // Override tokenURI to generate dynamic content
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId < _tokenIdCounter, "Token does not exist");
        
        // Generate dynamic SVG based on current block.timestamp
        string memory svg = generateSVG();
        string memory svgBase64 = Base64.encode(bytes(svg));
        string memory imageURI = string(abi.encodePacked("data:image/svg+xml;base64,", svgBase64));
        
        // Create metadata JSON in parts to avoid stack too deep
        string memory jsonPart1 = string(abi.encodePacked(
            '{"name": "Dynamic Time NFT #', tokenId.toString(),
            '", "description": "An on-chain SVG NFT that displays the current time from block.timestamp"'
        ));
        
        string memory jsonPart2 = string(abi.encodePacked(
            ', "image": "', imageURI,
            '", "attributes": [{"trait_type": "Timestamp", "value": "', block.timestamp.toString(), '"}]}'
        ));
        
        string memory json = string(abi.encodePacked(jsonPart1, jsonPart2));
        string memory jsonBase64 = Base64.encode(bytes(json));
        return string(abi.encodePacked("data:application/json;base64,", jsonBase64));
    }
    
    function generateSVG() internal view returns (string memory) {
        // Get time components using helper function
        TimeComponents memory time = getTimeComponents(block.timestamp);
        
        // Break SVG generation into smaller parts to avoid stack too deep
        string memory svgStart = string(abi.encodePacked(
            '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">',
            '<defs>',
            '<linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />',
            '<stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />',
            '</linearGradient>',
            '</defs>'
        ));
        
        string memory svgBackground = string(abi.encodePacked(
            '<rect width="100%" height="100%" fill="url(#grad1)"/>',
            '<circle cx="200" cy="200" r="150" fill="none" stroke="white" stroke-width="4"/>'
        ));
        
        string memory svgTitle = string(abi.encodePacked(
            '<text x="200" y="180" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">Current Time</text>'
        ));
        
        string memory timeString = string(abi.encodePacked(
            formatTime(time.hr), ':', formatTime(time.min), ':', formatTime(time.sec)
        ));
        
        string memory svgTime = string(abi.encodePacked(
            '<text x="200" y="220" font-family="Arial, sans-serif" font-size="36" fill="white" text-anchor="middle" font-weight="bold">',
            timeString,
            '</text>'
        ));
        
        string memory svgBlock = string(abi.encodePacked(
            '<text x="200" y="260" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle">',
            'Block: ', block.number.toString(),
            '</text>'
        ));
        
        string memory svgTimestamp = string(abi.encodePacked(
            '<text x="200" y="280" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle">',
            'Timestamp: ', block.timestamp.toString(),
            '</text>',
            '</svg>'
        ));
        
        // Combine all parts
        return string(abi.encodePacked(
            svgStart,
            svgBackground,
            svgTitle,
            svgTime,
            svgBlock,
            svgTimestamp
        ));
    }
    
    struct TimeComponents {
        uint256 hr;
        uint256 min;
        uint256 sec;
    }
    
    function getTimeComponents(uint256 timestamp) internal pure returns (TimeComponents memory) {
        uint256 secondsInDay = timestamp % 86400;
        uint256 hr = secondsInDay / 3600;
        uint256 min = (secondsInDay % 3600) / 60;
        uint256 sec = secondsInDay % 60;
        
        return TimeComponents(hr, min, sec);
    }
    
    function formatTime(uint256 time) internal pure returns (string memory) {
        if (time < 10) {
            return string(abi.encodePacked("0", time.toString()));
        }
        return time.toString();
    }
    
    // Function to get current time components (for testing/viewing)
    function getCurrentTime() public view returns (uint256 hr, uint256 min, uint256 sec, uint256 timestamp) {
        timestamp = block.timestamp;
        TimeComponents memory time = getTimeComponents(timestamp);
        return (time.hr, time.min, time.sec, timestamp);
    }
}