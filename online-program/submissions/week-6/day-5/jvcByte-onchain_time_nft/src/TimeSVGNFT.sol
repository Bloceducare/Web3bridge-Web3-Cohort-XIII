// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract TimeSVGNFT is ERC721 {
    using Strings for uint256;
    
    uint256 private _tokenCounter;
    
    constructor() ERC721("TimeSVGNFT", "TSNFT") {
        _tokenCounter = 0;
    }
    
    function mint(address to) public returns (uint256) {
        _tokenCounter++;
        uint256 newTokenId = _tokenCounter;
        _safeMint(to, newTokenId);
        return newTokenId;
    }
    
    // Helper function to get day name from timestamp
    function _getDayOfWeek(uint256 timestamp) internal pure returns (string memory) {
        uint256 dayOfWeek = ((timestamp / 1 days) + 4) % 7; // 0 = Sun, 1 = Mon, ..., 6 = Sat
        
        if (dayOfWeek == 0) return "Sun";
        if (dayOfWeek == 1) return "Mon";
        if (dayOfWeek == 2) return "Tue";
        if (dayOfWeek == 3) return "Wed";
        if (dayOfWeek == 4) return "Thu";
        if (dayOfWeek == 5) return "Fri";
        return "Sat";
    }
    
    // Helper function to get month name from month number (1-12)
    function _getMonthName(uint256 month) internal pure returns (string memory) {
        string[12] memory monthNames = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        require(month >= 1 && month <= 12, "Invalid month");
        return monthNames[month - 1];
    }
    
    // Function to get detailed time information with accurate date calculation
    function getDetailedTime() public view returns (
        uint256 seconds_,
        uint256 minutes_,
        uint256 hours_,
        uint256 day_,
        uint256 month_,
        uint256 year_,
        string memory dayName_
    ) {
        uint256 timestamp = block.timestamp;
        
        // Calculate time components
        seconds_ = timestamp % 60;
        minutes_ = (timestamp / 60) % 60;
        hours_ = (timestamp / 3600) % 24;
        
        // Calculate days since epoch (Jan 1, 1970)
        uint256 daysSinceEpoch = timestamp / 1 days;
        
        // Calculate year (accounting for leap years)
        year_ = 1970;
        while (true) {
            uint256 daysInYear = _isLeapYear(year_) ? 366 : 365;
            if (daysSinceEpoch >= daysInYear) {
                daysSinceEpoch -= daysInYear;
                year_++;
            } else {
                break;
            }
        }
        
        // Calculate month and day
        uint8[12] memory daysInMonth = [31, _isLeapYear(year_) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        
        month_ = 1;
        for (uint8 i = 0; i < 12; i++) {
            if (daysSinceEpoch >= daysInMonth[i]) {
                daysSinceEpoch -= daysInMonth[i];
                month_++;
            } else {
                break;
            }
        }
        
        // Day of month (add 1 since daysSinceEpoch is 0-indexed for the current month)
        day_ = daysSinceEpoch + 1;
        
        // Get day name
        dayName_ = _getDayOfWeek(timestamp);
    }
    
    // Helper function to check for leap years
    function _isLeapYear(uint256 year) internal pure returns (bool) {
        if (year % 4 != 0) {
            return false;
        } else if (year % 100 != 0) {
            return true;
        } else if (year % 400 != 0) {
            return false;
        } else {
            return true;
        }
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        // Get detailed time information
        (
            uint256 seconds_,
            uint256 minutes_,
            uint256 hours_,
            uint256 day_,
            uint256 month_,
            uint256 year_,
            string memory dayName_
        ) = getDetailedTime();
        
        // Format time string as s:m:h:dd:mm:yyyy
        string memory timeString = string(abi.encodePacked(
            year_.toString(), "/",
            month_ < 10 ? "0" : "", month_.toString(), "/",
            day_ < 10 ? "0" : "", day_.toString(), "  ",
            hours_.toString(), ":",
            minutes_.toString(), ":",
            seconds_.toString()
        ));
        
        // Create SVG with the formatted time and day name
        string memory svg = string(abi.encodePacked(
            '<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">',
            '<rect width="100%" height="100%" fill="#000000"/>',
            '<text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="20">',
            timeString,
            '</text>',
            '<text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="20">',
            dayName_,
            '</text>',
            '</svg>'
        ));
        
        // Create JSON metadata with detailed time information
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Time NFT #', tokenId.toString(), '",',
                        '"description": "Dynamic NFT showing current blockchain time",',
                        '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
                        '"attributes": [',
                        '{"trait_type": "Time", "value": "', timeString, '"},',
                        '{"trait_type": "Day", "value": "', dayName_, '"},',
                        '{"trait_type": "Day of Month", "value": ', day_.toString(), '},',
                        '{"trait_type": "Month", "value": ', month_.toString(), '},',
                        '{"trait_type": "Month Name", "value": "', _getMonthName(month_), '"},',
                        '{"trait_type": "Year", "value": ', year_.toString(), '},',
                        '{"trait_type": "Hours", "value": ', hours_.toString(), '},',
                        '{"trait_type": "Minutes", "value": ', minutes_.toString(), '},',
                        '{"trait_type": "Seconds", "value": ', seconds_.toString(), '},',
                        '{"trait_type": "Timestamp", "value": ', block.timestamp.toString(), '}',
                        ']',
                        '}'
                    )
                )
            )
        );
        
        return string(abi.encodePacked('data:application/json;base64,', json));
    }
}