
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/TicketToken.sol";
import "../src/TicketNft.sol";
import "../src/EventTicketing.sol";

contract EventTicketingScript is Script {
    function run() external {
        // Start broadcasting transactions
        vm.startBroadcast();

        // Deploy TicketToken with initial supply of 1M tokens
        TicketToken token = new TicketToken(1000000 * 10**18);
        console.log("Deployed TicketToken at:", address(token));

        // Deploy TicketNft
        TicketNft ticketNFT = new TicketNft();
        console.log("Deployed TicketNft at:", address(ticketNFT));

        // Deploy EventTicketing with token, NFT, and initial ticket price
        EventTicketing eventTicketing = new EventTicketing(
            address(token),
            address(ticketNFT),
            100 * 10**18
        );
        console.log("Deployed EventTicketing at:", address(eventTicketing));

        // Transfer TicketNft ownership to EventTicketing
        ticketNFT.transferOwnership(address(eventTicketing));
        console.log("Transferred TicketNft ownership to:", address(eventTicketing));

        // Stop broadcasting
        vm.stopBroadcast();
    }
}