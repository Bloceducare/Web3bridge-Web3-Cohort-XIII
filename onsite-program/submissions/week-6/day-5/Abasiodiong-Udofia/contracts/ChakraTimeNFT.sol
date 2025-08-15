// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./interfaces/IChakraTimeNFT.sol";
import "./libraries/Base64.sol";

contract ChakraTimeNFT is ERC721, IChakraTimeNFT {
    uint256 private _tokenIdCounter;

    constructor() ERC721("Chakra Time NFT", "CHAKRATIME") {}

    function safeMint(address to) external override {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);

        string memory svg = _generateSVG(block.timestamp);
        string memory imageBase64 = Base64.encode(bytes(svg));

        string memory json = string(abi.encodePacked(
            '{"name": "Chakra Time #', _toString(tokenId), '", ',
            '"description": "A dynamic NFT displaying the current time based on block.timestamp", ',
            '"image": "data:image/svg+xml;base64,', imageBase64, '"}'
        ));

        string memory jsonBase64 = Base64.encode(bytes(json));
        return string(abi.encodePacked("data:application/json;base64,", jsonBase64));
    }

    function _generateSVG(uint256 timestamp) internal pure returns (string memory) {
        uint256 second = timestamp % 60;
        uint256 minute = (timestamp / 60) % 60;
        uint256 hour = (timestamp / 3600) % 12;

        uint256 secondAngle = second * 6;
        uint256 minuteAngle = minute * 6 + second / 10;
        uint256 hourAngle = hour * 30 + minute / 2;

        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">',
            '<circle cx="100" cy="100" r="95" fill="none" stroke="black" stroke-width="5"/>',
            '<line x1="100" y1="100" x2="100" y2="30" stroke="blue" stroke-width="5" transform="rotate(', _toString(hourAngle), ' 100 100)"/>',
            '<line x1="100" y1="100" x2="100" y2="20" stroke="green" stroke-width="3" transform="rotate(', _toString(minuteAngle), ' 100 100)"/>',
            '<line x1="100" y1="100" x2="100" y2="10" stroke="red" stroke-width="1" transform="rotate(', _toString(secondAngle), ' 100 100)"/>',
            '</svg>'
        ));
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}