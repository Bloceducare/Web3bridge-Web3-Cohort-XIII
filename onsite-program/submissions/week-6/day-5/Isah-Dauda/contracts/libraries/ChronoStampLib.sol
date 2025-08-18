// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library ChronoStampLib {
    bytes internal constant TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    function toString(uint256 value) internal pure returns (string memory) {
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
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function base64Encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";

        uint256 len = data.length;
        uint256 encodedLen = 4 * ((len + 2) / 3);
        bytes memory result = new bytes(encodedLen);

        uint256 i = 0;
        uint256 j = 0;
        while (i + 3 <= len) {
            (result[j], result[j+1], result[j+2], result[j+3]) = encode3(
                uint8(data[i]),
                uint8(data[i+1]),
                uint8(data[i+2])
            );
            i += 3;
            j += 4;
        }

        // Remaining bytes
        if (i < len) {
            uint8 a = uint8(data[i]); i++;
            uint8 b = 0;
            uint8 c = 0;
            if (i < len) {
                b = uint8(data[i]);
            }
            (result[j], result[j+1], result[j+2], result[j+3]) = encode3(a, b, c);

            if ((len % 3) == 1) {
                result[j+2] = "=";
                result[j+3] = "=";
            } else if ((len % 3) == 2) {
                result[j+3] = "=";
            }
        }

        return string(result);
    }

    function encode3(uint8 a, uint8 b, uint8 c) private pure returns (bytes1, bytes1, bytes1, bytes1) {
        uint256 triple = (uint256(a) << 16) | (uint256(b) << 8) | uint256(c);
        bytes1 char0 = TABLE[(triple >> 18) & 0x3F];
        bytes1 char1 = TABLE[(triple >> 12) & 0x3F];
        bytes1 char2 = TABLE[(triple >> 6) & 0x3F];
        bytes1 char3 = TABLE[triple & 0x3F];
        return (char0, char1, char2, char3);
    }

    // The Magic
    function formatTime(uint256 timestamp) internal pure returns (string memory) {
        uint secsInDay = timestamp % 86400; 
        uint hourValue = secsInDay / 3600;
        uint minuteValue = (secsInDay % 3600) / 60;
        uint secondValue = secsInDay % 60;

        string memory hh = hourValue < 10 ? string(abi.encodePacked("0", toString(hourValue))) : toString(hourValue);
        string memory mm = minuteValue < 10 ? string(abi.encodePacked("0", toString(minuteValue))) : toString(minuteValue);
        string memory ss = secondValue < 10 ? string(abi.encodePacked("0", toString(secondValue))) : toString(secondValue);

        return string(abi.encodePacked(hh, ":", mm, ":", ss));
    }
}
