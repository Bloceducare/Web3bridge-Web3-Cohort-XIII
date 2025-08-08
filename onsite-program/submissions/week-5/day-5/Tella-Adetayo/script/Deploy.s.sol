// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EventTicketing.sol";
import "../src/TicketNFT.sol";
import "../src/TicketToken.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy NFT and Token first
        TicketNFT ticketNFT = new TicketNFT();
        TicketToken ticketToken = new TicketToken(1000e18);

        // Deploy EventTicketing with the required 4 params
        EventTicketing eventTicket = new EventTicketing(
            address(ticketToken),
            address(ticketNFT),
            0.01 ether, // creation fee
            0.005 ether // purchase fee
        );

        console.log("EventTicketing deployed at:", address(eventTicket));
        console.log("TicketNFT deployed at:", address(ticketNFT));
        console.log("TicketToken deployed at:", address(ticketToken));

        vm.stopBroadcast();
    }
}
