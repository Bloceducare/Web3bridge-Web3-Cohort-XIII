// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import  "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Base64.sol";



contract DynamicNft is ERC721URIStorage{
    uint256 private _nextTokenId;
    address owner;


    constructor () ERC721("TimeNft", "TNFT") {
        owner = msg.sender;

    }
    function mintTicket(address to) public {
        require(msg.sender == owner, "NOT_OWNER");

        string memory svg = generateDigitalClockSVG(getHour(), getMinute(), getSeconds());
        string memory imageUri = string(abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(bytes(svg))));

        string memory json = Base64.encode(bytes(string(abi.encodePacked(
            '{"name":"Time NFT",',
            '"description":"An NFT that captures the time of minting",',
            '"image":"', imageUri, '"}'
        ))));

        string memory tokenUri = string(abi.encodePacked("data:application/json;base64,", json));

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenUri);
    }


    function getHour () view private returns (uint) {
        uint256 currentTime = block.timestamp;
        return (currentTime/ 3600 ) %24;

    }

    function getMinute () view private returns (uint) {
        uint256 currentTime = block.timestamp;
        return  (currentTime / 60) % 60;
    }

    function getSeconds () view private returns (uint) {
        uint256 currentTime = block.timestamp;
        return currentTime % 60;
    }



    function generateDigitalClockSVG(uint256 hour,uint256 minute,uint256 second) public pure returns (string memory) {
        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">',
                // Background
                '<rect width="200" height="100" fill="black"/>',
                // Digital clock text (white monospace font)
                '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="40" fill="white">',
                _padTime(hour), ':', _padTime(minute), ':', _padTime(second),
                '</text>',
                '</svg>'
            )
        );
        return svg;
    }

    function _padTime(uint256 value) private pure returns (string memory) {
        if (value < 10) {
            return string(abi.encodePacked('0', _toString(value)));
        }
        return _toString(value);
    }


    function _toString(uint256 value) private pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }


}
