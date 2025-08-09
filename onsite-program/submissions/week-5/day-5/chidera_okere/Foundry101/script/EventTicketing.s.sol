// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "forge-std/console.sol"; 

import "../src/TicketToken.sol";
import "../src/TicketNft.sol";
import "../src/EventTicketing.sol";
import "../src/TokenSale.sol";

contract DeployWithConfig is Script {
    // Configuration
    uint256 constant INITIAL_TOKEN_SUPPLY = 1_000_000 ether;
    uint256 constant TOKENS_FOR_SALE = 500_000 ether;
    uint256 constant TOKEN_PRICE_IN_ETH = 0.001 ether; // 0.001 ETH per token
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy all contracts
        (
            TicketToken token,
            TicketNft nft,
            EventTicketing ticketing,
            TokenSale tokenSale
        ) = deployContracts();

        // Setup contracts (including ownership transfer)
        setupContracts(token, nft, ticketing, tokenSale);

        // Verify deployment
        verifyDeployment(token, nft, ticketing, tokenSale);

        vm.stopBroadcast();
    }

    function deployContracts() internal returns (
        TicketToken token,
        TicketNft nft,
        EventTicketing ticketing,
        TokenSale tokenSale
    ) {
        console.log("=== DEPLOYING CONTRACTS ===");
        
        // Deploy TicketToken
        token = new TicketToken(INITIAL_TOKEN_SUPPLY);
        console.log("TicketToken:", address(token));
        
        // Deploy TicketNft (owner will be the deployer initially)
        nft = new TicketNft();
        console.log("TicketNFT:", address(nft));
        console.log("Initial NFT owner:", nft.owner());
        
        // Deploy EventTicketing (without ownership transfer in constructor)
        ticketing = new EventTicketing(address(token), address(nft));
        console.log("EventTicketing:", address(ticketing));
        
        // Deploy TokenSale
        tokenSale = new TokenSale(address(token), TOKEN_PRICE_IN_ETH);
        console.log("TokenSale:", address(tokenSale));
    }

    function setupContracts(
        TicketToken token,
        TicketNft nft,
        EventTicketing ticketing,
        TokenSale tokenSale
    ) internal {
        console.log("\n=== SETTING UP CONTRACTS ===");
        
        // Transfer NFT ownership to EventTicketing contract
        // This is done AFTER both contracts are deployed
        console.log("Transferring NFT ownership...");
        console.log("From:", nft.owner());
        console.log("To:", address(ticketing));
        
        nft.transferOwnership(address(ticketing));
        console.log("NFT ownership transferred successfully");
        console.log("New NFT owner:", nft.owner());
        
        // Transfer tokens to sale contract
        token.transfer(address(tokenSale), TOKENS_FOR_SALE);
        console.log("Transferred", TOKENS_FOR_SALE / 1e18, "TKT to TokenSale");
    }

    function verifyDeployment(
        TicketToken token,
        TicketNft nft,
        EventTicketing ticketing,
        TokenSale tokenSale
    ) internal view {
        console.log("\n=== DEPLOYMENT VERIFICATION ===");
        
        // Verify token setup
        require(token.totalSupply() == INITIAL_TOKEN_SUPPLY, "Token supply incorrect");
        require(token.balanceOf(address(tokenSale)) == TOKENS_FOR_SALE, "TokenSale balance incorrect");
        console.log("Token balances correct");
        
        // Verify NFT ownership
        require(nft.owner() == address(ticketing), "NFT ownership transfer failed");
        console.log("NFT ownership correct");
        
        // Verify contract references
        require(address(ticketing.ticketToken()) == address(token), "Token reference incorrect");
        require(address(ticketing.ticketNft()) == address(nft), "NFT reference incorrect");
        console.log("Contract references correct");
        
        // Verify TokenSale setup
        require(tokenSale.tokenPrice() == TOKEN_PRICE_IN_ETH, "Token price incorrect");
        console.log("TokenSale configuration correct");
        
        console.log("ALL CONTRACTS DEPLOYED AND VERIFIED SUCCESSFULLY!");
        
        // Output addresses for frontend
        console.log("\n=== CONTRACT ADDRESSES ===");
        console.log("TicketToken:     ", address(token));
        console.log("TicketNft:       ", address(nft));
        console.log("EventTicketing:  ", address(ticketing));
        console.log("TokenSale:       ", address(tokenSale));
        
        console.log("\n=== CONFIGURATION ===");
        console.log("Initial Token Supply:", INITIAL_TOKEN_SUPPLY / 1e18, "TKT");
        console.log("Tokens for Sale:     ", TOKENS_FOR_SALE / 1e18, "TKT");
        console.log("Token Price:         ", TOKEN_PRICE_IN_ETH / 1e15, "milliETH");
        
        console.log("\n=== NEXT STEPS ===");
        console.log("1. Users can buy TKT tokens from TokenSale contract");
        console.log("2. Event organizers can create events via createTicket()");
        console.log("3. Users can buy tickets with TKT and receive NFTs");
    }
}