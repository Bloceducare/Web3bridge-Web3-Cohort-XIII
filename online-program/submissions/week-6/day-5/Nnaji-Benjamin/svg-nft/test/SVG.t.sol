// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {ClockSVG} from "../src/ClockSVG.sol";

contract ClockSVGTest is Test {
    ClockSVG clock;

    function setUp() public {
        clock = new ClockSVG();
        clock.mint(address(this));
    }

    function test_tokenURI_contains_time() public {
        // 12:34:56 UTC exactly
        vm.warp(12 hours + 34 minutes + 56 seconds);
        string memory uri = clock.tokenURI(1);
        assertTrue(bytes(uri).length > 0);
        assertTrue(_contains(uri, "12:34:56 UTC"));
    }

    function _contains(string memory hay, string memory needle) internal pure returns (bool) {
        return bytes(hay).length >= bytes(needle).length &&
            (keccak256(abi.encodePacked(hay)) != keccak256(abi.encodePacked(""))) &&
            (bytes(hay).length != 0) && (bytes(needle).length != 0) &&
            (bytes(hay).length >= bytes(needle).length) &&
            (indexOf(hay, needle) != type(uint256).max);
    }

    function indexOf(string memory a, string memory b) internal pure returns (uint256) {
        bytes memory aa = bytes(a);
        bytes memory bb = bytes(b);
        if (bb.length == 0 || bb.length > aa.length) return type(uint256).max;
        for (uint256 i = 0; i <= aa.length - bb.length; i++) {
            bool matchAll = true;
            for (uint256 j = 0; j < bb.length; j++) {
                if (aa[i + j] != bb[j]) { matchAll = false; break; }
            }
            if (matchAll) return i;
        }
        return type(uint256).max;
    }
}
