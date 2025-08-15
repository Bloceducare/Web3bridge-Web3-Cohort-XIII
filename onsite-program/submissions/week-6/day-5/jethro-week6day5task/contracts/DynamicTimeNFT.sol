// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract DynamicTimeNFT is ERC721 {
    uint256 private _tokenIdCounter;

    constructor() ERC721("DynamicTimeNFT", "DTNFT") {
        _tokenIdCounter = 0;
    }

    // Mint a new NFT
    function mint(address to) public returns (uint256) {
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;
        _safeMint(to, newTokenId);
        return newTokenId;
    }

    // Helper function to pad numbers with leading zero
    function padZero(uint256 num) private pure returns (string memory) {
        if (num < 10) {
            return string(abi.encodePacked("0", Strings.toString(num)));
        }
        return Strings.toString(num);
    }

    // Generate tokenURI with dynamic SVG showing digital time
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // Check if token exists using ownerOf
        try this.ownerOf(tokenId) returns (address) {
            // Token exists
        } catch {
            revert("ERC721: URI query for nonexistent token");
        }

        // Get formatted time
        uint256 timestamp = block.timestamp;
        uint256 hoursValue = (timestamp / 3600) % 24;
        uint256 minutesvalue = (timestamp / 60) % 60;
        uint256 secondsvalue = timestamp % 60;
        string memory timeStr = string(
            abi.encodePacked(
                padZero(hoursValue),
                ":",
                padZero(minutesvalue),
                ":",
                padZero(secondsvalue)
            )
        );

        // Create SVG with digital time
        string memory svg = string(
            abi.encodePacked(
                '<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">',
                '<rect width="300" height="300" fill="black"/>',
                '<text x="150" y="150" font-family="Arial" font-size="40" fill="white" text-anchor="middle">',
                timeStr,
                '</text>',
                '</svg>'
            )
        );

        // Encode SVG to base64
        string memory svgBase64 = Base64.encode(bytes(svg));

        // Create JSON metadata
        string memory json = string(
            abi.encodePacked(
                '{"name":"Dynamic Time NFT #',
                Strings.toString(tokenId),
                '","description":"An on-chain NFT that displays the current block timestamp.","image":"data:image/svg+xml;base64,',
                svgBase64,
                '"}'
            )
        );

        // Encode JSON to base64 and return as data URI
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(bytes(json))
            )
        );
    }
}