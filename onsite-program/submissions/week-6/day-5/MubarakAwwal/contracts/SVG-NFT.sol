// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract DynamicTimeNFT is ERC721 {
    uint256 public tokenCounter;

    constructor() ERC721("DynamicTimeNFT", "DTNFT") {
        tokenCounter = 0;
    }

    function mint() public {
        _safeMint(msg.sender, tokenCounter);
        tokenCounter++;
    }

    // Helper: pad single digit numbers with leading zero
    function _pad(uint256 num) internal pure returns (string memory) {
        if (num < 10) {
            return string(abi.encodePacked("0", Strings.toString(num)));
        }
        return Strings.toString(num);
    }

    // Convert timestamp to HH:MM:SS
    function _getTimeString(uint256 timestamp) internal pure returns (string memory) {
        uint256 secondsInDay = timestamp % 86400;
        uint256 hrs = secondsInDay / 3600;
        uint256 mins = (secondsInDay % 3600) / 60;
        uint256 secs = secondsInDay % 60;

        return string(
            abi.encodePacked(
                _pad(hrs), ":", _pad(mins), ":", _pad(secs)
            )
        );
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        string memory timeString = _getTimeString(block.timestamp);

        // Generate SVG
        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">',
                '<rect width="100%" height="100%" fill="black"/>',
                '<text x="50%" y="50%" fill="white" font-size="32" text-anchor="middle" dominant-baseline="middle">',
                timeString,
                '</text>',
                '</svg>'
            )
        );

        // Encode SVG in Base64
        string memory imageUri = string(
            abi.encodePacked(
                "data:image/svg+xml;base64,",
                Base64.encode(bytes(svg))
            )
        );

        // JSON metadata
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Dynamic Time NFT #',
                        Strings.toString(tokenId),
                        '", "description": "An on-chain NFT that shows the current blockchain time.", "image": "',
                        imageUri,
                        '"}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }
}
