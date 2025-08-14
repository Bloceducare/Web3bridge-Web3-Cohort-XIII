// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "../lib/forge-std/src/Script.sol";
import {MysteryBox} from "../src/Mystery.sol";

contract MysteryBoxScript is Script {
    MysteryBox public mystery;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        address _vrfCoord = 0x78805d2881d233a430983Dbc170990AefDe60C93;
        address _link = 0x6641415a61bCe80D97a715054d1334360Ab833Eb;
        bytes32 _keyhash = 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c;
        uint256 _fee = 60000;
        address _rToken = 0x4200000000000000000000000000000000000006;
        address _NFT = 0x11C2D0645fFfd70703EED3BbAf85356Cea64a96d;
        mystery = new MysteryBox(
            _vrfCoord,
            _link,
            _keyhash,
            _fee,
            _rToken,
            _NFT
        );

        vm.stopBroadcast();
    }
}
