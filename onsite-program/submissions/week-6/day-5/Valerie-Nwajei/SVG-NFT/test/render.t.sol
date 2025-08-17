// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "../lib/forge-std/src/Test.sol";
import {Render} from "../src/svg_render.sol";

contract RenderTest is Test {
    Render public render;

    function setUp() public {
        render = new Render();
    }

    function test_render() public view {
        string memory svg = render.renderSVG();
        console.log(svg);
    }
}
