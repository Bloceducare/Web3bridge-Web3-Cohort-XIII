// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ClockNFT is ERC721 {
    uint256 private _tokenIdCounter;

    constructor() ERC721("EngancheClockNFT", "EngancheClock") {}

    function mint() public {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(msg.sender, tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");

        // Get current time (UNIX timestamp)
        uint256 timestamp = block.timestamp;

        // Convert timestamp to human-readable time (HH:MM:SS UTC)
        (uint256 hrs, uint256 mins, uint256 secs) = _splitTimestamp(timestamp);

        // Dynamic SVG with live time
        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
                '<rect width="100%" height="100%" fill="#121212"/>',
                '<text x="50%" y="40%" fill="#FFFFFF" font-family="Courier New, monospace" font-size="24" text-anchor="middle" dominant-baseline="middle">BLOCKCHAIN CLOCK</text>',
                '<text x="50%" y="50%" fill="#00FF00" font-family="Courier New, monospace" font-size="36" text-anchor="middle" dominant-baseline="middle">',
                _formatTime(hrs, mins, secs),
                "</text>",
                '<text x="50%" y="60%" fill="#FFFFFF" font-family="Courier New, monospace" font-size="14" text-anchor="middle" dominant-baseline="middle">Last updated: ',
                Strings.toString(timestamp),
                "</text>",
                "</svg>"
            )
        );

        // Base64-encode the SVG
        string memory svgBase64 = Base64.encode(bytes(svg));

        // Enhanced metadata JSON with additional Rarible-friendly fields
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Blockchain Clock #',
                        Strings.toString(tokenId),
                        '",',
                        '"description": "A dynamic NFT that displays the current blockchain timestamp, updating with each block.",',
                        '"image": "data:image/svg+xml;base64,',
                        svgBase64,
                        '",',
                        '"attributes": [',
                        '{"trait_type": "Type", "value": "Dynamic Clock"},',
                        '{"trait_type": "Timestamp", "value": "',
                        Strings.toString(timestamp),
                        '"},',
                        '{"trait_type": "Time", "value": "',
                        _formatTime(hrs, mins, secs),
                        '"},',
                        '{"trait_type": "Block Number", "value": "',
                        Strings.toString(block.number),
                        '"}',
                        "],",
                        '"external_url": "https://your-website.com/clock/',
                        Strings.toString(tokenId),
                        '",',
                        '"animation_url": "data:image/svg+xml;base64,',
                        svgBase64,
                        '"',
                        "}"
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    // Helper: Split timestamp into hrs, mins, secs
    function _splitTimestamp(
        uint256 timestamp
    ) private pure returns (uint256 h, uint256 m, uint256 s) {
        h = (timestamp / 3600) % 24; // hrs (UTC)
        m = (timestamp / 60) % 60; // mins
        s = timestamp % 60; // secs
    }

    // Helper: Format time as "HH:MM:SS UTC"
    function _formatTime(
        uint256 h,
        uint256 m,
        uint256 s
    ) private pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    _twoDigits(h),
                    ":",
                    _twoDigits(m),
                    ":",
                    _twoDigits(s),
                    " UTC"
                )
            );
    }

    // Helper: Pad single-digit numbers with leading zero
    function _twoDigits(uint256 num) private pure returns (string memory) {
        return
            num < 10
                ? string(abi.encodePacked("0", Strings.toString(num)))
                : Strings.toString(num);
    }
}
