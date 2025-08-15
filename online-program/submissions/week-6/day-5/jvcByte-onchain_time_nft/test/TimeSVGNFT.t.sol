// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Test, stdError} from "forge-std/Test.sol";
import {TimeSVGNFT} from "../src/TimeSVGNFT.sol";
import {console} from "forge-std/console.sol";

contract TimeSVGNFTTest is Test {
    TimeSVGNFT public timeSVGNFT;
    address owner = address(0x1111111111111111111111111111111111111111);
    address user = address(0x2222222222222222222222222222222222222222);

    function setUp() public {
        vm.startPrank(owner);
        timeSVGNFT = new TimeSVGNFT();
        vm.stopPrank();
    }

    function test_Mint() public {
        vm.startPrank(owner);
        timeSVGNFT.mint(user);
        assertEq(timeSVGNFT.ownerOf(1), user);
        assertEq(timeSVGNFT.balanceOf(user), 1);
        vm.stopPrank();
    }

    function test_EveryBodyCanMint() public {
        vm.startPrank(user);
        timeSVGNFT.mint(user);
        timeSVGNFT.mint(user);
        assertEq(timeSVGNFT.ownerOf(2), user);
        assertEq(timeSVGNFT.balanceOf(user), 2);
        vm.stopPrank();
    }

    function test_TokenURI() public {
        vm.startPrank(owner);
        timeSVGNFT.mint(user);
        string memory uri = timeSVGNFT.tokenURI(1);
        console.log("Token URI:", uri);
        vm.stopPrank();
    }

    function test_TokenURIFormat() public {
        vm.startPrank(owner);
        timeSVGNFT.mint(user);
        string memory uri = timeSVGNFT.tokenURI(1);
        
        // Check basic URI structure
        assertTrue(
            bytes(uri).length > 0,
            "URI should not be empty"
        );
        assertTrue(
            startsWith(uri, "data:application/json;base64,"),
            "URI should start with data:application/json;base64,"
        );
        vm.stopPrank();
    }

    function test_TokenIdIncrements() public {
        vm.startPrank(owner);
        timeSVGNFT.mint(user);
        assertEq(timeSVGNFT.ownerOf(1), user);
        
        timeSVGNFT.mint(user);
        assertEq(timeSVGNFT.ownerOf(2), user);
        vm.stopPrank();
    }

    // Helper function to check string prefix
    function startsWith(string memory str, string memory prefix) private pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory prefixBytes = bytes(prefix);
        
        if (strBytes.length < prefixBytes.length) return false;
        
        for (uint i = 0; i < prefixBytes.length; i++) {
            if (strBytes[i] != prefixBytes[i]) return false;
        }
        return true;
    }
}
