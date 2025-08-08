// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {TiketItem} from "../src/TicketNFT.sol";
import {TiketToken} from "../src/Ticketing.sol";
import {EventTicketing} from "../src/EventTicketing.sol";

contract DeployEventTicketing is Script {
    function run() external {
        vm.startBroadcast();

        TiketToken token = new TiketToken(1000 ether);
        console.log("TiketToken deployed at:", address(token));

        TiketItem nft = new TiketItem();
        console.log("TiketItem deployed at:", address(nft));

        EventTicketing ticketing = new EventTicketing(
            address(nft),
            address(token),
            10 ether,
            100,
            "Blockchain Conference 2025",
            "A decentralized future summit"
        );
        console.log("EventTicketing deployed at:", address(ticketing));

        vm.stopBroadcast();
    }
}
