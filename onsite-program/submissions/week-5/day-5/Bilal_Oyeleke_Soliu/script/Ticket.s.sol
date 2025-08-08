// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/TIcketSFTFactory.sol";
import "../src/TicketToken.sol";
import "../src/TicketNFT.sol";

contract TicketScript is Script {
    EventFactory factory;
    address deployer;
    address buyer;

    function setUp() public {
        // The deployer address is taken from the private key when broadcasting
        deployer = vm.envAddress("DEPLOYER_ADDRESS");

        // For demonstration, the buyer is a different address
        buyer = vm.envAddress("BUYER_ADDRESS");
    }

    function run() public {
        vm.startBroadcast(deployer);

        // 1️⃣ Deploy EventFactory
        factory = new EventFactory(deployer);
        console.log("EventFactory deployed at:", address(factory));

        // 2️⃣ Create a new event
        (
            address erc20Addr,
            address nftAddr
        ) = factory.createEvent(
            "Web3bridge lagos Conference Token",
            "WLCT",            // ERC20 symbol
            1000000 ether,     // Total token supply
            "Bilal NFT",       // NFT name
            "BILAL",           // NFT symbol
            10 ether,          // Ticket price
            100                // Total tickets
        );

        console.log("ERC20 deployed at:", erc20Addr);
        console.log("NFT deployed at:", nftAddr);

        // 💡 Transfer some tokens from deployer to buyer so they can purchase tickets
        TicketToken(erc20Addr).transfer(buyer, 50 ether);

        vm.stopBroadcast();

        // 3️⃣ Buyer approves and buys ticket
        vm.startBroadcast(buyer);

        // Approve ticket payment
        TicketToken(erc20Addr).approve(address(factory), 10 ether);

        // Buy ticket
        factory.buyTicket(
            0, // Event ID
            "ipfs://bafkreic7ty3mmq26yncese7q6skvzhjllsj5vp5nvnzfhpu5p5lpol4uaq/metadata.json"
        );

        console.log("Buyer purchased ticket!");

        vm.stopBroadcast();
    }

}
