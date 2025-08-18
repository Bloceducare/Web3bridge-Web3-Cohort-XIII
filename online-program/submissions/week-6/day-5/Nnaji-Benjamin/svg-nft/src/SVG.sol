// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import  "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import   "@openzeppelin/contracts/access/Ownable.sol";
import  "@openzeppelin/contracts/utils/Strings.sol";
import  "@openzeppelin/contracts/utils/Base64.sol";


contract SVG is ERC721, Ownable {
    using Strings for uint256;

    uint256 public nextId = 1;

    constructor() ERC721("On-Chain Clock", "CLOCK") Ownable(msg.sender) {}

    function mint(address to) external onlyOwner returns (uint256 tokenId) {
        tokenId = nextId++;
        _safeMint(to, tokenId);
    }

    /// @notice Token metadata with an SVG image that shows the current UTC time
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");

        (uint256 hh, uint256 mm, uint256 ss) = _utcHMS(block.timestamp);
        string memory timeStr = _two(hh) // "HH"
            .concat(":").concat(_two(mm)).concat(":").concat(_two(ss)).concat(" UTC");

        // Minimal, readable SVG. Use a monospaced font for stable width.
        string memory svg = string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400">',
            '<defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">',
            '<stop offset="0%" stop-color="#111"/><stop offset="100%" stop-color="#333"/>',
            "</linearGradient></defs>",
            '<rect width="100%" height="100%" fill="url(#g)"/>',
            '<text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" ',
            'font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" ',
            'font-size="64" fill="white">', timeStr, "</text>",
            '<text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle" ',
            'font-family="sans-serif" font-size="18" fill="#aaaaaa">',
            "block.timestamp: ", uint256(block.timestamp).toString(),
            "</text></svg>"
        );

        string memory image = string.concat(
            "data:image/svg+xml;base64,", Base64.encode(bytes(svg))
        );

        string memory json = string.concat(
            '{"name":"On-Chain Clock #', tokenId.toString(),
            '","description":"An on-chain SVG clock that renders the current UTC time from block.timestamp.",',
            '"image":"', image, '"}'
        );

        return string.concat(
            "data:application/json;base64,", Base64.encode(bytes(json))
        );
    }

    // ---- helpers ----

    function _two(uint256 v) internal pure returns (string memory) {
        // zero-pad to 2 digits
        if (v < 10) return string.concat("0", v.toString());
        return v.toString();
    }

    /// @dev Convert UNIX timestamp to hours/minutes/seconds (UTC) without date libraries
    function _utcHMS(uint256 ts) internal pure returns (uint256 hh, uint256 mm, uint256 ss) {
        uint256 daySeconds = 24 * 60 * 60; // 86400
        uint256 secs = ts % daySeconds;
        hh = secs / 3600;
        mm = (secs % 3600) / 60;
        ss = secs % 60;
    }
}

library Concat {
    function concat(string memory a, string memory b) internal pure returns (string memory) {
        return string.concat(a, b);
    }
}
using Concat for string;
