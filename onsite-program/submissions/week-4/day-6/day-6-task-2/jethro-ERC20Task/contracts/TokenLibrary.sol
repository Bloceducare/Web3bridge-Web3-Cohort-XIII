// SPDX-License-License: MIT
pragma solidity ^0.8.20;

library TokenLibrary {
    struct TokenInfo {
        string name;
        string symbol;
        uint8 decimals;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "Overflow");
        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "Underflow");
        return a - b;
    }
}