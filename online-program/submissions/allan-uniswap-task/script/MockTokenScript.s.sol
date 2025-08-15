// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {MockERC20WithPermit} from "../src/MockERC20WithPermit.sol";

contract MockTokenScript is Script {
    MockERC20WithPermit public token;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // Deploy mock token with 1 million initial supply
        token = new MockERC20WithPermit(
            "Mock Token",
            "MOCK",
            1_000_000 * 10**18
        );

        console.log("Mock Token deployed at:", address(token));

        vm.stopBroadcast();
    }
}
