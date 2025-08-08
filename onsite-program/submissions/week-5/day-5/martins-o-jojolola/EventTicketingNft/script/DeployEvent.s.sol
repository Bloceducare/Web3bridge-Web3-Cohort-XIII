// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/EventTicketing.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        EventToken eventToken = new EventToken("EventCoin", "EVC", 1_000_000);

        console.log("EventToken deployed at:", address(eventToken));

        EventNFTs eventNFTs = new EventNFTs();
        console.log("EventNFTs deployed at:", address(eventNFTs));

        Event eventContract = new Event(
            address(eventToken),
            address(eventNFTs)
        );

        console.log("Event contract deployed at:", address(eventContract));

        eventNFTs.transferOwnership(address(eventContract));
        console.log("EventNFTs ownership transferred to Event contract");

        eventToken.mint(msg.sender, 10000 * 10 ** 18); // 10,000 tokens
        console.log("Minted 10,000 tokens to deployer");

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("EventToken:", address(eventToken));
        console.log("EventNFTs:", address(eventNFTs));
        console.log("Event Contract:", address(eventContract));
        console.log("Deployer:", msg.sender);
    }
}

contract CreateSampleEventScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address eventContractAddress = vm.envAddress("EVENT_CONTRACT_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        Event eventContract = Event(eventContractAddress);

        uint256 eventId = eventContract.createEvent(
            "Blockchain Conference 2025",
            "Annual blockchain and cryptocurrency conference",
            100 * 10 ** 18,
            1000,
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            "Convention Center, Downtown",
            "https://ipfs.io/ipfs/dee735a9-f2fe-414a-acaa-b3124e9d2240"
        );

        console.log("Created event with ID:", eventId);

        vm.stopBroadcast();
    }
}
