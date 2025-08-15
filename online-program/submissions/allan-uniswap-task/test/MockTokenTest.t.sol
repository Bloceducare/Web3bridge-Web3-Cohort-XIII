// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {MockERC20WithPermit} from "../src/MockERC20WithPermit.sol";

contract MockTokenTest is Test {
    MockERC20WithPermit public token;
    address public owner;
    address public spender;
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18;

    function setUp() public {
        owner = address(this);
        spender = address(0x1);

        token = new MockERC20WithPermit(
            "Mock Token",
            "MOCK",
            INITIAL_SUPPLY
        );
    }

    function test_InitialSupply() public {
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY);
    }

    function test_Mint() public {
        uint256 mintAmount = 1000 * 10**18;
        token.mint(spender, mintAmount);

        assertEq(token.balanceOf(spender), mintAmount);
        assertEq(token.totalSupply(), INITIAL_SUPPLY + mintAmount);
    }

    function test_PermitFunctionality() public {
        // This test will be expanded when we implement permit testing
        assertTrue(address(token) != address(0));
        assertEq(token.name(), "Mock Token");
        assertEq(token.symbol(), "MOCK");
    }
}
