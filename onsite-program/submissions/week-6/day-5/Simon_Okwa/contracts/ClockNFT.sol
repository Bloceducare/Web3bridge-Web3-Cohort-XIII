// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Base64.sol";

contract ClockNFT is ERC721URIStorage, Ownable {
    event Minted(uint256 tokenId);

    uint256  tokenIdCounter; 

    constructor() ERC721("ClockNFT", "TIME") Ownable(msg.sender) {}

    // Mint a new NFT (anyone can mint)
    function mint() public returns (uint256) {
        tokenIdCounter += 1; 
        uint256 newItemId = tokenIdCounter;
        _safeMint(msg.sender, newItemId);
        emit Minted(newItemId);
        return newItemId;
    }

    // Generates SVG with current time from block.timestamp
    function generateSVG() internal view returns (string memory) {
        // Get current time from block.timestamp (Unix time in seconds)
        uint256 timestamp = block.timestamp;
        uint256 secondsInDay = 86400;  
        uint256 timeOfDay = timestamp % secondsInDay;
        uint256 hoursCount = timeOfDay / 3600;
        uint256 minutesCount = (timeOfDay % 3600) / 60;
        uint256 secondsCount = timeOfDay % 60;

        // Format time as HH:MM:SS
        string memory timeString = string(abi.encodePacked(
            hoursCount < 10 ? "0" : "", Strings.toString(hoursCount), ":",
            minutesCount < 10 ? "0" : "", Strings.toString(minutesCount), ":",
            secondsCount < 10 ? "0" : "", Strings.toString(secondsCount)
        ));

        // Create SVG: a box with time text
        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">',
            '<rect width="300" height="300" fill="#e0f7fa"/>',
            '<text x="150" y="130" font-size="30" text-anchor="middle" fill="#000">Clock NFT</text>',
            '<text x="150" y="180" font-size="50" text-anchor="middle" fill="#d81b60">', timeString, '</text>',
            '</svg>'
        ));
    }

    // Converts SVG to base64 image URI
    function svgToImageURI(string memory svg) internal pure returns (string memory) {
        string memory baseURL = "data:image/svg+xml;base64,";
        string memory svgBase64Encoded = Base64.encode(bytes(svg));
        return string(abi.encodePacked(baseURL, svgBase64Encoded));
    }

    // Formats tokenURI with dynamic SVG
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");

        string memory svg = generateSVG();
        string memory imageURI = svgToImageURI(svg);

        // Create JSON metadata
        string memory json = string(abi.encodePacked(
            '{"name": "Clock NFT #', Strings.toString(tokenId), '", ',
            '"description": "A dynamic on-chain NFT displaying the current blockchain time", ',
            '"image": "', imageURI, '"}'
        ));

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }
}