// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {IPermit} from "../src/IPermit.sol";

contract CounterScript is Script {
    IPermit public Ipermit;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        Ipermit = IPermit(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
        // Ipermit.permitTransferFrom(permit, transferDetails, owner, signature);




        vm.stopBroadcast();
    }
}
