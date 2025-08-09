// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/TicketNft.sol";
import "../src/TicketToken.sol";
import "../src/EventTicketing.sol";

contract DeployEventTicketing is Script {
    
    // Deployment configuration
    uint256 constant INITIAL_TOKEN_SUPPLY = 1000000 * 10**18; // 1 million tokens with 18 decimals
    string constant NFT_NAME = "Event Ticket NFT";
    string constant NFT_SYMBOL = "ETNFT";
    string constant TOKEN_NAME = "Event Token";
    string constant TOKEN_SYMBOL = "ET";
    
    function run() external {
        // Get the private key from environment variable
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Get the deployer address
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Step 1: Deploy TicketToken contract
        console.log("\n=== Deploying TicketToken ===");
        TicketToken ticketToken = new TicketToken(
            INITIAL_TOKEN_SUPPLY
        );
        console.log("TicketToken deployed at:", address(ticketToken));
        console.log("Token Name:", ticketToken.name());
        console.log("Token Symbol:", ticketToken.symbol());
        console.log("Total Supply:", ticketToken.totalSupply());
        console.log("Deployer Token Balance:", ticketToken.balanceOf(deployer));
        
        // Step 2: Deploy TicketNft contract
        console.log("\n=== Deploying TicketNft ===");
        TicketNft ticketNft = new TicketNft();
        console.log("TicketNft deployed at:", address(ticketNft));
        console.log("NFT Name:", ticketNft.name());
        console.log("NFT Symbol:", ticketNft.symbol());
        
        // Step 3: Deploy EventTicketing contract
        console.log("\n=== Deploying EventTicketing ===");
        EventTicketing eventTicketing = new EventTicketing(
            address(ticketNft),
            address(ticketToken)
        );
        console.log("EventTicketing deployed at:", address(eventTicketing));
        console.log("Contract Owner:", eventTicketing.owner());
        console.log("Next Event ID:", eventTicketing.nextEventId());
        
      
        
        
        // Step 5: Optional - Transfer some tokens to test accounts for demo
        // You can uncomment this section if you want to distribute tokens for testing
        /*
        console.log("\n=== Distributing Test Tokens ===");
        address[] memory testAccounts = new address[](2);
        testAccounts[0] = 0x1234567890123456789012345678901234567890; // Replace with actual test addresses
        testAccounts[1] = 0x2345678901234567890123456789012345678901; // Replace with actual test addresses
        
        uint256 testAmount = 1000 * 10**18; // 1000 tokens per test account
        
        for (uint256 i = 0; i < testAccounts.length; i++) {
            if (testAccounts[i] != address(0)) {
                ticketToken.transfer(testAccounts[i], testAmount);
                console.log("Transferred", testAmount, "tokens to:", testAccounts[i]);
            }
        }
        */
        
        // Stop broadcasting
        vm.stopBroadcast();
        
        // Step 6: Display deployment summary
        console.log("\n========================================");
        console.log("           DEPLOYMENT COMPLETE          ");
        console.log("========================================");
        console.log("Deployer Address:    ", deployer);
        console.log("TicketToken:         ", address(ticketToken));
        console.log("TicketNft:           ", address(ticketNft));
        console.log("EventTicketing:      ", address(eventTicketing));
        console.log("========================================");
        
        // Step 7: Save deployment addresses to file
        string memory deploymentInfo = string(abi.encodePacked(
            "# Deployment Addresses\n",
            "TICKET_TOKEN=", vm.toString(address(ticketToken)), "\n",
            "TICKET_NFT=", vm.toString(address(ticketNft)), "\n",
            "EVENT_TICKETING=", vm.toString(address(eventTicketing)), "\n",
            "DEPLOYER=", vm.toString(deployer), "\n"
        ));
        
        vm.writeFile("./deployment-addresses.txt", deploymentInfo);
        console.log("Deployment addresses saved to: deployment-addresses.txt");
        
        // Step 8: Generate verification commands
        console.log("\n=== Verification Commands ===");
        console.log("forge verify-contract", address(ticketToken), "src/TicketToken.sol:TicketToken --chain-id", block.chainid);
        console.log("forge verify-contract", address(ticketNft), "src/TicketNft.sol:TicketNft --chain-id", block.chainid);
        console.log("forge verify-contract", address(eventTicketing), "src/EventTicketing.sol:EventTicketing --chain-id", block.chainid);
    }
    
    // Helper function to check deployment success
    function verifyDeployment(
        address tokenAddress,
        address nftAddress,
        address eventTicketingAddress
    ) internal view {
        console.log("\n=== Verifying Deployment ===");
        
        // Check if contracts have code
        require(tokenAddress.code.length > 0, "TicketToken deployment failed");
        require(nftAddress.code.length > 0, "TicketNft deployment failed");
        require(eventTicketingAddress.code.length > 0, "EventTicketing deployment failed");
        
        console.log("All contracts deployed successfully!");
    }
}