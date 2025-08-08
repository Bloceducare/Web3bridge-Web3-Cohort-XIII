// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/EventTicketing.sol";
import "../src/TicketToken.sol";
import "../src/TicketNft.sol";

contract DeployEventTicketing is Script {
    function setUp() public {}

    function run() public {
        // Get the private key from environment variable
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the EventTicketing contract
        // This will automatically deploy TicketToken and TicketNft inside the constructor
        EventTicketing eventTicketing = new EventTicketing();

        // Get the addresses of the deployed token and NFT contracts
        address ticketTokenAddress = address(eventTicketing.ticketToken());
        address ticketNftAddress = address(eventTicketing.ticketNft());

        // Stop broadcasting
        vm.stopBroadcast();

        // Log the deployed addresses
        console.log("EventTicketing deployed to:", address(eventTicketing));
        console.log("TicketToken deployed to:", ticketTokenAddress);
        console.log("TicketNft deployed to:", ticketNftAddress);

        // Create a summary file with deployment info
        string memory deploymentInfo = string.concat(
            "EventTicketing Contract: ", vm.toString(address(eventTicketing)), "\n",
            "TicketToken Contract: ", vm.toString(ticketTokenAddress), "\n",
            "TicketNft Contract: ", vm.toString(ticketNftAddress), "\n",
            "Deployer: ", vm.toString(vm.addr(deployerPrivateKey)), "\n"
        );

        // Write deployment info to file
        vm.writeFile("./deployments.txt", deploymentInfo);
        
        console.log("\nDeployment completed successfully!");
        console.log("Deployment info saved to deployments.txt");
    }
}