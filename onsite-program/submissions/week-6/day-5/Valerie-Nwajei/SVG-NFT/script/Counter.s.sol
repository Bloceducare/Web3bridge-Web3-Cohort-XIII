// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "../lib/forge-std/src/Script.sol";
import {Render} from "../src/svg_render.sol";

contract RenderScript is Script {
    Render public render;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        render = new Render();

        vm.stopBroadcast();
    }
}
