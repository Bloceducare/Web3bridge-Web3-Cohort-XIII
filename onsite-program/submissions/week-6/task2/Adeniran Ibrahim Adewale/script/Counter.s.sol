// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PermitSwap} from "../src/PermitSwap.sol";
import {ERC20Token} from "../src/ERC20Token.sol";

contract PermitSwapD is Script {
    PermitSwap public counter;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        counter = new PermitSwap(0xE592427A0AEce92De3Edee1F18E0157C05861564);

        vm.stopBroadcast();
    }
}

contract ERC20TokenD is Script {
    ERC20Token public counter;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        counter = new ERC20Token("Web3Bridge", "W3B", 1000e18);

        vm.stopBroadcast();
    }
}
