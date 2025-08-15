// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title TimeSvgNFT
/// @notice On-chain SVG NFT whose tokenURI() dynamically renders the current UTC time from block.timestamp
contract TimeSvgNFT is ERC721 {
    uint256 private _nextId;

    constructor() ERC721("Time SVG", "TSVG") {}

    /// @notice Mint a new token to the caller
    function mint() external returns (uint256 tokenId) {
        tokenId = ++_nextId;
        _safeMint(msg.sender, tokenId);
    }

    function totalMinted() external view returns (uint256) {
        return _nextId;
    }

    /// @inheritdoc ERC721
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "ERC721: invalid token ID");

        string memory timeStr = _formatTime(block.timestamp);
        string memory svg = _buildSVG(timeStr);

        bytes memory json = abi.encodePacked(
            '{"name":"Time SVG #', Strings.toString(tokenId),
            '","description":"On-chain SVG that shows current UTC time from block.timestamp. Rendering updates on each tokenURI call.",',
            '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '"}'
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(json)));
    }

    function _buildSVG(string memory timeStr) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300">',
                '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs>',
                '<rect width="100%" height="100%" fill="url(#g)"/>',
                '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#e2e8f0" font-family="monospace" font-size="48">',
                timeStr,
                "</text>",
                '<text x="50%" y="80%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="16">block.timestamp</text>',
                "</svg>"
            )
        );
    }

    function _formatTime(uint256 ts) internal pure returns (string memory) {
        uint256 secondsInDay = 24 * 60 * 60;
        uint256 s = ts % secondsInDay;
        uint256 hh = s / 3600;
        uint256 mm = (s % 3600) / 60;
        uint256 ss = s % 60;

        return string(abi.encodePacked(_twoDigits(hh), ":", _twoDigits(mm), ":", _twoDigits(ss), " UTC"));
    }

    function _twoDigits(uint256 v) internal pure returns (string memory) {
        if (v < 10) {
            return string(abi.encodePacked("0", Strings.toString(v)));
        }
        return Strings.toString(v);
    }
}
