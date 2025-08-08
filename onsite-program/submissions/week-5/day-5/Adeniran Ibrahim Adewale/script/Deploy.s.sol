// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EventTicketing.sol";
import "../src/TicketNft.sol";
import "../src/TicketToken.sol";

contract Deploy is Script {
    function run() external {
        // Load deployer's private key from environment variable
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy contracts
        EventTicketing eventTicket = new EventTicketing(0x6Cac76f9e8d6F55b3823D8aEADEad970a5441b67);
        TicketNft ticketNFT = new TicketNft("Permit Ticket", "PTM");
        TicketToken ticketToken = new TicketToken("Permit Token", "PTT", 1000e18);

        // Optional: log deployed addresses
        console.log("EventTicketing deployed at:", address(eventTicket));
        console.log("TicketNFT deployed at:", address(ticketNFT));
        console.log("TicketToken deployed at:", address(ticketToken));

        vm.stopBroadcast();
    }
}
