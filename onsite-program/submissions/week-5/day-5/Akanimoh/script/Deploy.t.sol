// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/Ticketing.sol";
import "../src/TicketToken.sol";
import "../src/TicketNFT.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        
        TicketToken token = new TicketToken(1000 ether);
        TicketNFT nft = new TicketNFT();
        Ticketing ticketing = new Ticketing();

        console.log("TicketToken deployed at:", address(token));
        console.log("TicketNFT deployed at:", address(nft));
        console.log("Ticketing deployed at:", address(ticketing));

        vm.stopBroadcast();
    }
}