// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {EventTicketSystem} from "../src/EventTicketSystem.sol";
import {EventNFT} from "../src/EventNFT.sol";
import {EventToken} from "../src/EventToken.sol";

contract EventTicketSystemScript is Script {
    EventTicketSystem public eventTicketSystem;
    EventNFT public nft;
    EventToken public token;
    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        nft= new EventNFT();
        token = new EventToken(1000);
        eventTicketSystem = new EventTicketSystem(address(token), address(nft));
        vm.stopBroadcast();
    }
}
