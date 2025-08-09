// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "forge-std/console.sol"; 

import "../src/TicketToken.sol";
import "../src/TicketNft.sol";
import "../src/EventTicketing.sol";

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

        // Setup contracts
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
        
        token = new TicketToken(INITIAL_TOKEN_SUPPLY);
        console.log("✓ TicketToken:", address(token));
        
        nft = new TicketNft();
        console.log("✓ TicketNFT:", address(nft));
        
        ticketing = new EventTicketing(address(token), address(nft));
        console.log("✓ EventTicketing:", address(ticketing));
        
        tokenSale = new TokenSale(address(token), TOKEN_PRICE_IN_ETH);
        console.log("✓ TokenSale:", address(tokenSale));
    }

    function setupContracts(
        TicketToken token,
        TicketNft nft,
        EventTicketing ticketing,
        TokenSale tokenSale
    ) internal {
        console.log("\n=== SETTING UP CONTRACTS ===");
        
        // Transfer tokens to sale contract
        token.transfer(address(tokenSale), TOKENS_FOR_SALE);
        console.log("✓ Transferred", TOKENS_FOR_SALE / 1e18, "TKT to TokenSale");
        
        // Verify NFT ownership was transferred
        require(nft.owner() == address(ticketing), "NFT ownership transfer failed");
        console.log("✓ NFT ownership transferred to EventTicketing");
    }

    function verifyDeployment(
        TicketToken token,
        TicketNft nft,
        EventTicketing ticketing,
        TokenSale tokenSale
    ) internal view {
        console.log("\n=== DEPLOYMENT VERIFICATION ===");
        
        // Verify token setup
        assert(token.totalSupply() == INITIAL_TOKEN_SUPPLY);
        assert(token.balanceOf(address(tokenSale)) == TOKENS_FOR_SALE);
        console.log("✓ Token balances correct");
        
        // Verify NFT ownership
        assert(nft.owner() == address(ticketing));
        console.log("✓ NFT ownership correct");
        
        // Verify contract references
        assert(address(ticketing.ticketToken()) == address(token));
        assert(address(ticketing.ticketNft()) == address(nft));
        console.log("✓ Contract references correct");
        
        console.log("\n🎉 ALL CONTRACTS DEPLOYED AND VERIFIED SUCCESSFULLY!");
        
        // Output addresses for frontend
        console.log("\n=== CONTRACT ADDRESSES (save these for frontend) ===");
        console.log("TICKET_TOKEN_ADDRESS=%s", address(token));
        console.log("TICKET_NFT_ADDRESS=%s", address(nft));
        console.log("EVENT_TICKETING_ADDRESS=%s", address(ticketing));
        console.log("TOKEN_SALE_ADDRESS=%s", address(tokenSale));
    }
}
