// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract StringsContract {
    function toString(uint256 value) public pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits = 0;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        uint256 index = digits;
        temp = value;
        while (temp != 0) {
            index--;
            buffer[index] = bytes1(uint8(48 + uint256(temp % 10)));
            temp /= 10;
        }
        return string(buffer);
    }

    function twoDigitString(uint256 value) public pure returns (string memory) {
        require(value < 100, "value too big for two digits");
        if (value < 10) {
            return string(abi.encodePacked("0", toString(value)));
        }
        return toString(value);
    }
}