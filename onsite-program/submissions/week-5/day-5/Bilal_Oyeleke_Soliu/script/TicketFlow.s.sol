// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/EventFactory.sol";
import { TicketToken } from "../src/TicketToken.sol";

contract TicketFlow is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        uint256 buyerKey = vm.envUint("BUYER_PRIVATE_KEY");

        address deployer = vm.addr(deployerKey);
        address buyer = vm.addr(buyerKey);

        // Event token/NFT details
        string memory tokenName = vm.envString("TOKEN_NAME");
        string memory tokenSymbol = vm.envString("TOKEN_SYMBOL");
        uint256 tokenSupply = vm.envUint("TOKEN_SUPPLY");

        string memory nftName = vm.envString("NFT_NAME");
        string memory nftSymbol = vm.envString("NFT_SYMBOL");

        uint256 ticketPrice = vm.envUint("TICKET_PRICE");
        uint256 totalTickets = vm.envUint("TOTAL_TICKETS");
        uint256 eventEndDate = vm.envUint("EVENT_END_DATE");
        string memory tokenURI = vm.envString("METADATA_URI");

        console.log("=== STEP 1: Deploying EventFactory ===");
        vm.startBroadcast(deployerKey);
        EventFactory factory = new EventFactory(deployer);
        vm.stopBroadcast();

        console.log("=== STEP 2: Creating Event ===");
        vm.startBroadcast(deployerKey);
        (address erc20Address, address nftAddress) = factory.createEvent(
            tokenName,
            tokenSymbol,
            tokenSupply,
            nftName,
            nftSymbol,
            ticketPrice,
            totalTickets,
            eventEndDate
        );
        vm.stopBroadcast();

        console.log("ERC20 Token Address:", erc20Address);
        console.log("NFT Contract Address:", nftAddress);

        console.log("=== STEP 3: Sending ERC20 to Buyer ===");
        vm.startBroadcast(deployerKey);
        TicketToken(erc20Address).transfer(buyer, ticketPrice);
        vm.stopBroadcast();

        console.log("=== STEP 4: Buyer Approves Organizer ===");
        vm.startBroadcast(buyerKey);
        TicketToken(erc20Address).approve(deployer, ticketPrice); // approve organizer
        vm.stopBroadcast();

        console.log("=== STEP 5: Buyer Purchases Ticket ===");
        vm.startBroadcast(buyerKey);
        factory.buyTicket(0, tokenURI);
        vm.stopBroadcast();

        console.log("Ticket purchased successfully! NFT minted to:", buyer);
    }
}
