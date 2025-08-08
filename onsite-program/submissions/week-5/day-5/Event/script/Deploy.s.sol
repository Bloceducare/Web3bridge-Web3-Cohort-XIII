pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EventToken.sol";
import "../src/TicketNFT.sol";
import "../src/TicketingPlatform.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        // Deploy EventToken with 1000 tokens
        EventToken token = new EventToken(1000 * 10**18);
        // Deploy TicketNFT
        TicketNFT ticketNFT = new TicketNFT("Test Event");
        // Deploy TicketingPlatform
        TicketingPlatform platform = new TicketingPlatform(
            address(token),
            address(ticketNFT),
            100 * 10**18
        );
        // Set TicketingPlatform as the minter
        ticketNFT.setTicketingPlatform(address(platform));
        vm.stopBroadcast();

        // Log contract addresses
        console.log("EventToken deployed at:", address(token));
        console.log("TicketNFT deployed at:", address(ticketNFT));
        console.log("TicketingPlatform deployed at:", address(platform));
    }
}