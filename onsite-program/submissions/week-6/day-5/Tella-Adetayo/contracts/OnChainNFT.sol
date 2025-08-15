// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract EShockUNFT is ERC721 {
    uint256 private _nextTokenId;

    event MintToken(uint256 indexed tokenId);

    constructor() ERC721("E Shock U NFT", "ESU") {}

    // Mint a new NFT
    function mint() public {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        emit MintToken(tokenId);
    }

    // Fully dynamic tokenURI
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        //require(_exists(tokenId), "NFT does not exist");

        // Current block timestamp
        uint256 timestamp = block.timestamp;
        (uint256 hrs, uint256 mins, uint256 secs) = _splitTimestamp(timestamp);

        // Build SVG dynamically
        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
                // Nigeria flag background: green-white-green
                '<rect x="0" y="0" width="133.33" height="400" fill="#008751"/>',
                '<rect x="133.33" y="0" width="133.34" height="400" fill="#ffffff"/>',
                '<rect x="266.67" y="0" width="133.33" height="400" fill="#008751"/>',
                // Title
                '<text x="50%" y="40%" fill="#000000" font-family="Courier New, monospace" font-size="24" text-anchor="middle" dominant-baseline="middle">BLOCKCHAIN CLOCK</text>',
                // Dynamic time
                '<text x="50%" y="50%" fill="#000000" font-family="Courier New, monospace" font-size="36" text-anchor="middle" dominant-baseline="middle">',
                _formatTime(hrs, mins, secs),
                '</text>',
                // Timestamp
                '<text x="50%" y="60%" fill="#000000" font-family="Courier New, monospace" font-size="14" text-anchor="middle" dominant-baseline="middle">Last updated: ',
                Strings.toString(timestamp),
                '</text>',
                '</svg>'
            )
        );

        // Encode SVG to Base64
        string memory imageURI = string(
            abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(bytes(svg)))
        );

        // Build JSON metadata dynamically
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Blockchain Clock #', Strings.toString(tokenId), '",',
                        '"description": "A dynamic NFT that displays the current blockchain timestamp, updating with each block.",',
                        '"image": "', imageURI, '",',
                        '"attributes": [',
                            '{"trait_type": "Type", "value": "Dynamic Clock"},',
                            '{"trait_type": "Timestamp", "value": "', Strings.toString(timestamp), '"},',
                            '{"trait_type": "Time", "value": "', _formatTime(hrs, mins, secs), '"},',
                            '{"trait_type": "Block Number", "value": "', Strings.toString(block.number), '"}',
                        ']',
                        '}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    // Helpers: Split timestamp into hours, minutes, seconds
    function _splitTimestamp(uint256 timestamp) internal pure returns (uint256 h, uint256 m, uint256 s) {
        h = (timestamp / 3600) % 24;
        m = (timestamp / 60) % 60;
        s = timestamp % 60;
    }

    // Helpers: Format as HH:MM:SS UTC
    function _formatTime(uint256 h, uint256 m, uint256 s) internal pure returns (string memory) {
        return string(
            abi.encodePacked(_twoDigits(h), ":", _twoDigits(m), ":", _twoDigits(s), " UTC")
        );
    }

    // Helper: pad single digits
    function _twoDigits(uint256 num) internal pure returns (string memory) {
        return num < 10 ? string(abi.encodePacked("0", Strings.toString(num))) : Strings.toString(num);
    }
}
