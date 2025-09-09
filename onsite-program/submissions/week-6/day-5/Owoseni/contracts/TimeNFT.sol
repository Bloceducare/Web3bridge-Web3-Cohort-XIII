// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// BokkyPooBahsDateTimeLibrary for timestamp conversion
library BokkyPooBahsDateTimeLibrary {
    uint constant SECONDS_PER_DAY = 24 * 60 * 60;
    uint constant SECONDS_PER_HOUR = 60 * 60;
    uint constant SECONDS_PER_MINUTE = 60;
    int constant OFFSET19700101 = 2440588;

    function _daysToDate(uint _days) internal pure returns (uint year, uint month, uint day) {
        int __days = int(_days);
        int L = __days + 68569 + OFFSET19700101;
        int N = 4 * L / 146097;
        L = L - (146097 * N + 3) / 4;
        int _year = 4000 * (L + 1) / 1461001;
        L = L - 1461 * _year / 4 + 31;
        int _month = 80 * L / 2447;
        int _day = L - 2447 * _month / 80;
        L = _month / 11;
        _month = _month + 2 - 12 * L;
        _year = 100 * (N - 49) + _year + L;
        year = uint(_year);
        month = uint(_month);
        day = uint(_day);
    }

    function timestampToDateTime(uint timestamp) internal pure returns (uint year, uint month, uint day, uint hour, uint minute, uint second) {
        uint _days = timestamp / SECONDS_PER_DAY;
        (year, month, day) = _daysToDate(_days);
        uint secsRemaining = timestamp % SECONDS_PER_DAY;
        hour = secsRemaining / SECONDS_PER_HOUR;
        secsRemaining = secsRemaining % SECONDS_PER_HOUR;
        minute = secsRemaining / SECONDS_PER_MINUTE;
        second = secsRemaining % SECONDS_PER_MINUTE;
    }
}

contract TimeNFT is ERC721 {
    using Strings for uint256;
    using BokkyPooBahsDateTimeLibrary for uint;

    constructor() ERC721("Dynamic Time NFT", "TIME") {
        _mint(msg.sender, 1); // Mint token ID 1 to the deployer
    }

    function padZero(uint256 num) internal pure returns (string memory) {
        if (num < 10) {
            return string(abi.encodePacked("0", num.toString()));
        } else {
            return num.toString();
        }
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId); // Ensure token exists

        // Get current timestamp and convert to date/time components
        uint timestamp = block.timestamp;
        (uint year, uint month, uint day, uint hour, uint minute, uint second) = timestamp.timestampToDateTime();

        // Format as "YYYY-MM-DD HH:MM:SS UTC"
        string memory dateStr = string(abi.encodePacked(
            year.toString(), "-",
            padZero(month), "-",
            padZero(day)
        ));
        string memory timeStr = string(abi.encodePacked(
            padZero(hour), ":",
            padZero(minute), ":",
            padZero(second), " UTC"
        ));
        string memory fullTime = string(abi.encodePacked(dateStr, " ", timeStr));

        // Generate SVG string
        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">',
            '<rect width="400" height="200" fill="#000000"/>',
            '<text x="200" y="100" font-size="24" fill="#FFFFFF" text-anchor="middle" font-family="Arial">Current Time:</text>',
            '<text x="200" y="140" font-size="28" fill="#FFFFFF" text-anchor="middle" font-family="Arial">', fullTime, '</text>',
            '</svg>'
        ));

        // Base64 encode the SVG
        string memory svgBase64 = Base64.encode(bytes(svg));

        // Generate JSON metadata
        string memory json = string(abi.encodePacked(
            '{"name": "Dynamic Time NFT #', tokenId.toString(), '", ',
            '"description": "A fully on-chain NFT that displays the current blockchain time (block.timestamp) in UTC whenever viewed.", ',
            '"image": "data:image/svg+xml;base64,', svgBase64, '"}'
        ));

        // Base64 encode the JSON and return as data URI
        string memory jsonBase64 = Base64.encode(bytes(json));
        return string(abi.encodePacked("data:application/json;base64,", jsonBase64));
    }
}