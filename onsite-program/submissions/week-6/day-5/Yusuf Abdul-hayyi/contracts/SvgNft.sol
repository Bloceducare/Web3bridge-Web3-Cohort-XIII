// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract SvgNft is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _tokenIdCounter;

    constructor() ERC721("SvgNft", "SVGNFT") Ownable(msg.sender) {}

    /// Mint a token to caller
    function mint() external onlyOwner {
        _tokenIdCounter += 1;
        _safeMint(msg.sender, _tokenIdCounter);
    }

    /// Build dynamic metadata with current blockchain time
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        //require(_exists(tokenId), "TimeSVG: nonexistent token");
        // Get current time from block.timestamp
        uint256 ts = block.timestamp;
        uint256 secsOfDay = ts % 86400; // seconds since midnight UTC
        uint256 hrs = secsOfDay / 3600;
        uint256 mins = (secsOfDay % 3600) / 60;
        uint256 secs = secsOfDay % 60;

        // Convert to strings with leading zeros
        string memory hh = _twoDigits(hrs);
        string memory mm = _twoDigits(mins);
        string memory ss = _twoDigits(secs);

        string memory timeString = string(abi.encodePacked(hh, ":", mm, ":", ss));

        // Create SVG
        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">',
                    '<style>text { fill: white; font-family: monospace; font-size: 36px; }</style>',
                    '<rect width="100%" height="100%" fill="black"/>',
                    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">',
                        timeString,
                    '</text>',
                '</svg>'
            )
        );

        // Encode SVG to base64
        string memory image = string(
            abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(bytes(svg)))
        );

        // Encode JSON metadata to base64
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name":"Time #', tokenId.toString(),
                        '","description":"An on-chain SVG NFT showing blockchain time.",',
                        '"image":"', image, '"}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    /// Format numbers as two digits
    function _twoDigits(uint256 value) internal pure returns (string memory) {
        if (value < 10) {
            return string(abi.encodePacked("0", value.toString()));
        }
        return value.toString();
    }
}
