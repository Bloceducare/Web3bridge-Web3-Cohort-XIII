// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PaymentToken.sol";
import "../src/TicketNFT.sol";
import "../src/EventManager.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        
        // Deploy all contracts
        PaymentToken paymentToken = new PaymentToken();
        TicketNFT ticketNFT = new TicketNFT();
        EventManager eventManager = new EventManager(address(paymentToken), address(ticketNFT));
        
        // Transfer NFT ownership to EventManager
        ticketNFT.transferOwnership(address(eventManager));
        
        console.log("PaymentToken deployed:", address(paymentToken));
        console.log("TicketNFT deployed:", address(ticketNFT));
        console.log("EventManager deployed:", address(eventManager));
        
        vm.stopBroadcast();
    }
}