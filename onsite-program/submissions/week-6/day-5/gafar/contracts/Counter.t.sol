// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "./Counter.sol";

contract TimeNFTTest is Test {
    TimeNFT timeNFT;
    address owner = address(0x1);
    address user = address(0x2);

    // Setup function runs before each test
    function setUp() public {
        vm.prank(owner);
        timeNFT = new TimeNFT();
    }

    // Test deployment: name and symbol
    function test_Deployment() public {
        assertEq(timeNFT.name(), "Dynamic NFT", "Incorrect contract name");
        assertEq(timeNFT.symbol(), "DYNAMITE", "Incorrect contract symbol");
    }

    // Test minting functionality
    function test_Mint() public {
        vm.startPrank(user);
        uint256 tokenId = timeNFT.mint();
        assertEq(tokenId, 1, "First token ID should be 1");
        assertEq(timeNFT.ownerOf(1), user, "Token should be owned by user");
        assertEq(timeNFT.balanceOf(user), 1, "User should have 1 NFT");

        // Test second mint to verify counter increment
        uint256 secondTokenId = timeNFT.mint();
        assertEq(secondTokenId, 2, "Second token ID should be 2");
        assertEq(timeNFT.ownerOf(2), user, "Second token should be owned by user");
        assertEq(timeNFT.balanceOf(user), 2, "User should have 2 NFTs");
        vm.stopPrank();

        // Verify Transfer event for first mint
        vm.expectEmit(true, true, true, true);
        emit Transfer(address(0), user, 1);
        vm.prank(user);
        timeNFT.mint(); // Mint another to check event (for next token ID)
    }

    // Test getCurrentTime function
    function test_GetCurrentTime() public {
        // Set block timestamp for predictable testing
        uint256 timestamp = 1631234567; // 2021-09-09 22:42:47 UTC
        vm.warp(timestamp);

        (string memory timeStr, uint256 returnedTimestamp) = timeNFT.getCurrentTime();
        
        uint256 hour = (timestamp % 86400) / 3600; // 22
        uint256 minute = (timestamp % 3600) / 60; // 42
        uint256 second = timestamp % 60; // 47

        string memory expectedTimeStr = string(
            abi.encodePacked(
                hour < 10 ? string(abi.encodePacked("0", toString(hour))) : toString(hour),
                ":",
                minute < 10 ? string(abi.encodePacked("0", toString(minute))) : toString(minute),
                ":",
                second < 10 ? string(abi.encodePacked("0", toString(second))) : toString(second)
            )
        );

        assertEq(timeStr, expectedTimeStr, "Time string should match expected format");
        assertEq(returnedTimestamp, timestamp, "Timestamp should match block.timestamp");
    }

    // Test generateSVG function
    function test_GenerateSVG() public {
        string memory timeStr = "12:34:56";
        string memory svg = timeNFT.generateSVG(timeStr);

        string memory expectedSvg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
                '<rect width="100%" height="100%" fill="#1a1a1a"/>',
                '<circle cx="200" cy="200" r="150" fill="none" stroke="#730A49" stroke-width="10"/>',
                '<text x="50%" y="45%" font-family="Arial" font-size="24" fill="#FFFFFF" text-anchor="middle">Dynamic Time NFT</text>',
                '<text x="50%" y="55%" font-family="Arial" font-size="40" fill="#730A49" text-anchor="middle" dominant-baseline="middle">',
                timeStr,
                '</text>',
                '<text x="50%" y="65%" font-family="Arial" font-size="14" fill="#AAAAAA" text-anchor="middle">Updates when viewed</text>',
                '</svg>'
            )
        );

        assertEq(svg, expectedSvg, "SVG should match expected output");
        assertTrue(bytes(svg).length > 0, "SVG should not be empty");
        assertTrue(
            contains(svg, timeStr),
            "SVG should contain the time string"
        );
        assertTrue(
            contains(svg, 'xmlns="http://www.w3.org/2000/svg"'),
            "SVG should contain xmlns attribute"
        );
    }

    // Test tokenURI function
    function test_TokenURI() public {
        // Mint a token
        vm.prank(user);
        uint256 tokenId = timeNFT.mint();

        // Set block timestamp
        uint256 timestamp = 1631234567;
        vm.warp(timestamp);

        (string memory timeStr,) = timeNFT.getCurrentTime();
        string memory tokenUri = timeNFT.tokenURI(tokenId);

        // Verify tokenURI starts with data URI
        assertTrue(
            startsWith(tokenUri, "data:application/json;base64,"),
            "Token URI should start with data:application/json;base64,"
        );

        // Decode Base64 JSON
        string memory base64Json = substring(tokenUri, 28, bytes(tokenUri).length);
        bytes memory decodedJsonBytes = vm.parseBase64(base64Json);
        string memory decodedJson = string(decodedJsonBytes);

        // Parse JSON (basic checks since Foundry doesn't have a JSON parser)
        assertTrue(
            contains(decodedJson, string(abi.encodePacked('"name": "Dynamic Time NFT #', toString(tokenId), '"'))),
            "JSON should contain correct name"
        );
        assertTrue(
            contains(decodedJson, '"description": "An NFT that displays the current blockchain time (updates when viewed)."'),
            "JSON should contain correct description"
        );
        assertTrue(
            contains(decodedJson, string(abi.encodePacked('"value": "', timeStr, '"'))),
            "JSON should contain correct time attribute"
        );

        // Extract and decode SVG from image field
        string memory imageField = extractImageField(decodedJson);
        assertTrue(
            startsWith(imageField, "data:image/svg+xml;base64,"),
            "Image field should start with data:image/svg+xml;base64,"
        );

        string memory base64Svg = substring(imageField, 26, indexOf(imageField, "?t="));
        bytes memory decodedSvgBytes = vm.parseBase64(base64Svg);
        string memory decodedSvg = string(decodedSvgBytes);

        assertTrue(
            contains(decodedSvg, timeStr),
            "SVG in tokenURI should contain time string"
        );
        assertTrue(
            contains(decodedSvg, 'xmlns="http://www.w3.org/2000/svg"'),
            "SVG in tokenURI should contain xmlns attribute"
        );
    }

    // Helper functions
    function toString(uint256 value) internal pure returns (string memory) {
        return Strings.toString(value);
    }

    function contains(string memory haystack, string memory needle) internal pure returns (bool) {
        bytes memory h = bytes(haystack);
        bytes memory n = bytes(needle);
        if (n.length > h.length) return false;
        for (uint256 i = 0; i <= h.length - n.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < n.length; j++) {
                if (h[i + j] != n[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    }

    function startsWith(string memory str, string memory prefix) internal pure returns (bool) {
        bytes memory s = bytes(str);
        bytes memory p = bytes(prefix);
        if (p.length > s.length) return false;
        for (uint256 i = 0; i < p.length; i++) {
            if (s[i] != p[i]) return false;
        }
        return true;
    }

    function substring(string memory str, uint256 start, uint256 end) internal pure returns (string memory) {
        bytes memory s = bytes(str);
        bytes memory result = new bytes(end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = s[i];
        }
        return string(result);
    }

    function indexOf(string memory str, string memory search) internal pure returns (uint256) {
        bytes memory s = bytes(str);
        bytes memory n = bytes(search);
        if (n.length > s.length) return s.length;
        for (uint256 i = 0; i <= s.length - n.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < n.length; j++) {
                if (s[i + j] != n[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return i;
        }
        return s.length;
    }

    function extractImageField(string memory json) internal pure returns (string memory) {
        string memory imagePrefix = '"image":"';
        string memory imageSuffix = '",';
        uint256 start = indexOf(json, imagePrefix) + bytes(imagePrefix).length;
        uint256 end = indexOf(json, imageSuffix, start);
        return substring(json, start, end);
    }

    function indexOf(string memory str, string memory search, uint256 from) internal pure returns (uint256) {
        bytes memory s = bytes(str);
        bytes memory n = bytes(search);
        if (n.length > s.length || from > s.length) return s.length;
        for (uint256 i = from; i <= s.length - n.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < n.length; j++) {
                if (s[i + j] != n[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return i;
        }
        return s.length;
    }
}
