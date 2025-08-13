// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {IERC20Permit} from "../src/IERC20.sol";

contract CounterScript is Script {
    IERC20Permit public Ipermit;

    function setUp() public {}

    function run() public {
vm.startBroadcast();
        uint privateKey = 0xA11CE;
        address newUser = vm.addr(privateKey);


        vm.stopBroadcast();        
    }
}
