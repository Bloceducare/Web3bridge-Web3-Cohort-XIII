// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract CosmicTimeNFT is ERC721 {
    uint256 private tokenIdCounter = 1; 

    constructor() ERC721("Cosmic Time NFT", "COSMIC") {}

    function mint() public returns (uint256) {
        uint256 tokenId = tokenIdCounter;
        _safeMint(msg.sender, tokenId);
        tokenIdCounter++;
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // require(_exists(tokenId), "ERC721: URI query for nonexistent token");
        
        // Get current time components
        (string memory timeStr, uint256 timestamp) = getCurrentTime();
        
        // Create dynamic SVG that changes with time
        string memory svg = generateSVG(timeStr, timestamp);
        
        // Create JSON metadata with cache-busting parameter
        string memory json = string(abi.encodePacked(
            '{"name": "Cosmic Time NFT #', Strings.toString(tokenId), '",',
            '"description": "A cosmic NFT that displays the current blockchain time with space aesthetics (updates when viewed).",',
            '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '?t=', Strings.toString(timestamp), '",',
            '"attributes": [{"trait_type": "Last Update", "value": "', timeStr, '"},',
            '{"trait_type": "Timestamp", "value": ', Strings.toString(timestamp), '}]',
            '}'
        ));
        
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    function getCurrentTime() internal view returns (string memory, uint256) {
        uint256 timestamp = block.timestamp;
        uint256 hour = (timestamp % 86400) / 3600;
        uint256 minute = (timestamp % 3600) / 60;
        uint256 second = timestamp % 60;
        
        string memory hoursStr = hour < 10 ? string(abi.encodePacked("0", Strings.toString(hour))) : Strings.toString(hour);
        string memory minutesStr = minute < 10 ? string(abi.encodePacked("0", Strings.toString(minute))) : Strings.toString(minute);
        string memory secondsStr = second < 10 ? string(abi.encodePacked("0", Strings.toString(second))) : Strings.toString(second);
        
        string memory timeStr = string(abi.encodePacked(hoursStr, ":", minutesStr, ":", secondsStr));
        
        return (timeStr, timestamp);
    }

    function generateSVG(string memory timeStr, uint256 timestamp) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">',
            '<defs>',
                '<radialGradient id="spaceGrad" cx="50%" cy="50%" r="70%">',
                    '<stop offset="0%" style="stop-color:#1a1a3a;stop-opacity:1"/>',
                    '<stop offset="50%" style="stop-color:#2d1b69;stop-opacity:1"/>',
                    '<stop offset="100%" style="stop-color:#0f0f23;stop-opacity:1"/>',
                '</radialGradient>',
                '<linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">',
                    '<stop offset="0%" style="stop-color:#ff006e;stop-opacity:1"/>',
                    '<stop offset="50%" style="stop-color:#8338ec;stop-opacity:1"/>',
                    '<stop offset="100%" style="stop-color:#3a86ff;stop-opacity:1"/>',
                '</linearGradient>',
                '<linearGradient id="timeGrad" x1="0%" y1="0%" x2="100%" y2="0%">',
                    '<stop offset="0%" style="stop-color:#00f5ff;stop-opacity:1"/>',
                    '<stop offset="100%" style="stop-color:#ff0080;stop-opacity:1"/>',
                '</linearGradient>',
                '<filter id="neonGlow">',
                    '<feGaussianBlur stdDeviation="4" result="coloredBlur"/>',
                    '<feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>',
                '</filter>',
                '<filter id="softGlow">',
                    '<feGaussianBlur stdDeviation="2" result="coloredBlur"/>',
                    '<feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>',
                '</filter>',
            '</defs>',
            generateBackground(),
            generateMainDesign(),
            generateTimestampDisplay(timeStr, timestamp),
            '</svg>'
        ));
    }

    function generateBackground() internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<rect width="400" height="400" fill="url(#spaceGrad)"/>',
            '<circle cx="80" cy="60" r="1" fill="#ffffff" opacity="0.8"/>',
            '<circle cx="150" cy="40" r="0.5" fill="#ffffff" opacity="0.6"/>',
            '<circle cx="320" cy="80" r="1.5" fill="#ffffff" opacity="0.9"/>',
            '<circle cx="50" cy="150" r="0.8" fill="#ffffff" opacity="0.7"/>',
            '<circle cx="360" cy="120" r="1" fill="#ffffff" opacity="0.8"/>',
            '<circle cx="30" cy="300" r="1.2" fill="#ffffff" opacity="0.6"/>',
            '<circle cx="370" cy="280" r="0.7" fill="#ffffff" opacity="0.9"/>',
            '<circle cx="280" cy="350" r="1" fill="#ffffff" opacity="0.5"/>'
        ));
    }

    function generateMainDesign() internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<circle cx="200" cy="180" r="80" fill="none" stroke="url(#neonGrad)" stroke-width="3" filter="url(#neonGlow)" opacity="0.8"/>',
            '<circle cx="200" cy="180" r="60" fill="none" stroke="#ff006e" stroke-width="1.5" opacity="0.4"/>',
            '<circle cx="200" cy="180" r="40" fill="none" stroke="#8338ec" stroke-width="1" opacity="0.6"/>',
            '<circle cx="200" cy="180" r="25" fill="url(#timeGrad)" filter="url(#softGlow)" opacity="0.9"/>',
            '<circle cx="280" cy="180" r="4" fill="#ff006e" opacity="0.7"/>',
            '<circle cx="120" cy="180" r="3" fill="#8338ec" opacity="0.8"/>',
            '<circle cx="200" cy="100" r="2.5" fill="#3a86ff" opacity="0.9"/>',
            '<circle cx="200" cy="260" r="3.5" fill="#00f5ff" opacity="0.6"/>',
            '<text x="200" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="url(#neonGrad)" font-weight="bold" filter="url(#softGlow)">COSMIC TIME NFT</text>'
        ));
    }

    function generateTimestampDisplay(string memory timeStr, uint256 timestamp) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<rect x="50" y="280" width="300" height="90" fill="rgba(0, 0, 0, 0.7)" rx="15" stroke="url(#neonGrad)" stroke-width="2" filter="url(#softGlow)"/>',
            '<text x="70" y="305" font-family="Courier New, monospace" font-size="10" fill="#00f5ff" opacity="0.8">function tokenURI(uint256 tokenId)</text>',
            '<text x="70" y="325" font-family="Courier New, monospace" font-size="12" fill="#ff0080" font-weight="bold">block.timestamp:</text>',
            '<text x="200" y="325" font-family="Courier New, monospace" font-size="12" fill="#ffffff" font-weight="bold">', Strings.toString(timestamp), '</text>',
            '<text x="70" y="345" font-family="Courier New, monospace" font-size="10" fill="#8338ec" opacity="0.9">getCurrentTime() returns:</text>',
            generateDigitalClock(timeStr),
            '<text x="320" y="360" font-family="Courier New, monospace" font-size="10" fill="#00f5ff" opacity="0.8">UTC</text>',
            '<text x="70" y="390" font-family="Courier New, monospace" font-size="8" fill="#666" opacity="0.7">Updates when viewed</text>'
        ));
    }

    function generateDigitalClock(string memory timeStr) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<g transform="translate(200, 360)">',
                '<rect x="-45" y="-10" width="90" height="18" fill="rgba(255, 0, 110, 0.2)" rx="3"/>',
                '<text x="0" y="3" text-anchor="middle" font-family="Courier New, monospace" font-size="16" fill="#ff006e" font-weight="bold">', timeStr, '</text>',
            '</g>'
        ));
    }
}