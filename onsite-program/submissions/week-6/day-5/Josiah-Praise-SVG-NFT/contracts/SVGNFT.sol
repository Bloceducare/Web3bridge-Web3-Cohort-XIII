// SPDX-License-Identifier: MITT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


contract TimeNFT is ERC721 {

    uint256 private _tokenIdCounter;

    constructor() ERC721("TimeNFT", "TIME") {
        _tokenIdCounter = 0;
    }

    function mint(address to) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _tokenIdCounter += 1;
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {

        // require(_exists(tokenId), "ERC721: URI query for nonexistent token");
        uint256 timestamp = block.timestamp;
        uint256 hour = (timestamp % 86400) / 3600;
        uint256 minute = (timestamp % 3600) / 60;
        uint256 second = timestamp % 60;

        string memory hoursStr = hour < 10 ? string(abi.encodePacked("0", Strings.toString(hour))) : Strings.toString(hour);
        string memory minutesStr = minute < 10 ? string(abi.encodePacked("0", Strings.toString(minute))) : Strings.toString(minute);
        string memory secondsStr = second < 10 ? string(abi.encodePacked("0", Strings.toString(second))) : Strings.toString(second);

        string memory timeStr = string(abi.encodePacked(hoursStr, ":", minutesStr, ":", secondsStr));

        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
                '<rect width="100%" height="100%" fill="#1a1a1a"/>',
                '<circle cx="200" cy="200" r="150" fill="none" stroke="#ff0000ff" stroke-width="10"/>',
                '<text x="50%" y="50%" font-family="Arial" font-size="40" fill="#ff0000ff" text-anchor="middle" dominant-baseline="middle">',
                timeStr,
                '</text>',
                '</svg>'
            )
        );

        string memory svgBase64 = Base64.encode(bytes(svg));

        string memory json = string(
            abi.encodePacked(
                '{',
                '"name": "TimeNFT #', Strings.toString(tokenId), '",',
                '"description": "An on-chain SVG NFT displaying the current time based on block.timestamp.",',
                '"image": "data:image/svg+xml;base64,', svgBase64, '"',
                '}'
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }
}