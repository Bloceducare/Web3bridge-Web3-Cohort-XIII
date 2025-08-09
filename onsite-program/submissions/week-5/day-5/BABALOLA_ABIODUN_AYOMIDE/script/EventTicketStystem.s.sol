// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script,console} from "forge-std/Script.sol";
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
        console.log("ticketNft contract address at: ", address(nft));
        token = new EventToken(1000000000000000);
        console.log("ticketToken contract address at: ", address(token));
        eventTicketSystem = new EventTicketSystem(address(token), address(nft));
        console.log("EventTicketing contract address at: ", address(eventTicketSystem));

        vm.stopBroadcast();
    }
}
