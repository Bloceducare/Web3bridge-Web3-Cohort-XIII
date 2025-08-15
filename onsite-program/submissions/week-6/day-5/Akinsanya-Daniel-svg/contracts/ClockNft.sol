// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ClockNft is ERC721 {
    using Strings for uint256;

    uint256 private _tokenIdCounter;

    constructor() ERC721("ClockNFT", "CLOCK") {}

    function mint() public returns (uint256) {
        uint256 newTokenId = _tokenIdCounter++;
        _safeMint(msg.sender, newTokenId);
        return newTokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        string memory timeStr = getCurrentTimeString();

        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
            '<rect width="400" height="400" fill="#000000"/>', // Black background
            '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="60" fill="#ffffff">', // White text centered
            timeStr,
            '</text>',
            '</svg>'
        ));

        string memory svgBase64 = Base64.encode(bytes(svg));

        string memory json = string(abi.encodePacked(
            '{"name": "Clock NFT #', tokenId.toString(), '", ',
            '"description": "An on-chain SVG NFT that dynamically displays the current blockchain time (UTC).", ',
            '"image": "data:image/svg+xml;base64,', svgBase64, '"}'
        ));

        string memory jsonBase64 = Base64.encode(bytes(json));
        return string(abi.encodePacked("data:application/json;base64,", jsonBase64));
    }

    function getCurrentTimeString() internal view returns (string memory) {
        uint256 timestamp = block.timestamp;
        uint256 hour = (timestamp / 3600) % 24;
        uint256 minute = (timestamp / 60) % 60;
        uint256 second = timestamp % 60;

        return string(abi.encodePacked(
            hour < 10 ? "0" : "", hour.toString(), ":",
            minute < 10 ? "0" : "", minute.toString(), ":",
            second < 10 ? "0" : "", second.toString()
        ));
    }
}