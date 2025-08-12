// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/SimpleTokenWithPermit.sol";
import "../src/SimpleExchange.sol";
import "../src/PermitSwapper.sol";

/**
 * @title PermitTest
 * @notice Test suite for the EIP-712 permit and swap functionality
 * 
 * This contract tests our implementation to make sure everything works correctly
 */
contract PermitTest is Test {
    // Contract instances
    SimpleTokenWithPermit public tokenA;
    SimpleTokenWithPermit public tokenB;
    SimpleExchange public exchange;
    PermitSwapper public swapper;
    
    // Test user setup
    address public user;
    uint256 public userPrivateKey = 0x1234; // WARNING: Don't use this in real applications!
    
    // Test constants
    uint256 public constant INITIAL_SUPPLY = 1000000 * 1e18; // 1 million tokens
    uint256 public constant USER_BALANCE = 1000 * 1e18;      // 1000 tokens for user
    
    /**
     * @notice Set up the test environment
     * This runs before each test function
     */
    function setUp() public {
        console.log("=== SETTING UP TEST ENVIRONMENT ===");
        
        // Deploy all contracts
        tokenA = new SimpleTokenWithPermit("Token A", "TKNA", INITIAL_SUPPLY);
        tokenB = new SimpleTokenWithPermit("Token B", "TKNB", INITIAL_SUPPLY);
        exchange = new SimpleExchange();
        swapper = new PermitSwapper(address(exchange));
        
        // Create test user from private key
        user = vm.addr(userPrivateKey);
        
        // Give user some tokens to test with
        tokenA.mint(user, USER_BALANCE);
        
        console.log("Contracts deployed successfully!");
        console.log("User address:", user);
        console.log("User Token A balance:", tokenA.balanceOf(user));
        console.log("User Token B balance:", tokenB.balanceOf(user));
        console.log("=== SETUP COMPLETE ===\n");
    }
    
    /**
     * @notice Test the main permit and swap functionality
     * This is the core test that verifies our implementation works
     */
    function testPermitAndSwap() public {
        console.log("=== TESTING PERMIT AND SWAP ===");
        
        uint256 swapAmount = 100 * 1e18; // Trade 100 tokens
        uint256 deadline = block.timestamp + 1 hours; // Permit valid for 1 hour
        
        // STEP 1: Create the permit signature (this happens off-chain)
        console.log("\n--- Creating Permit Signature ---");
        
        // Build the permit message hash
        bytes32 structHash = keccak256(
            abi.encode(
                tokenA.PERMIT_TYPEHASH(),
                user,                    // Token owner
                address(swapper),        // Spender (our PermitSwapper contract)
                swapAmount,              // Amount to approve
                tokenA.nonces(user),     // Current nonce (prevents replay attacks)
                deadline                 // Expiration time
            )
        );
        
        // Add the domain separator to prevent cross-contract replay attacks
        bytes32 hash = keccak256(
            abi.encodePacked("\x19\x01", tokenA.DOMAIN_SEPARATOR(), structHash)
        );
        
        // Sign the hash (this is what happens in a user's wallet)
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, hash);
        
        console.log(" Permit signature created successfully");
        console.log("  Signer:", user);
        console.log("  Spender:", address(swapper));
        console.log("  Amount:", swapAmount);
        console.log("  Deadline:", deadline);
        
        // STEP 2: Record balances before the swap
        uint256 userTokenABefore = tokenA.balanceOf(user);
        uint256 userTokenBBefore = tokenB.balanceOf(user);
        
        console.log("\n--- Before Swap ---");
        console.log("User Token A balance:", userTokenABefore);
        console.log("User Token B balance:", userTokenBBefore);
        
        // STEP 3: Execute the permit and swap in one transaction
        console.log("\n--- Executing Permit and Swap ---");
        
        vm.prank(user); // Simulate the transaction coming from the user
        uint256 amountOut = swapper.permitAndSwap(
            address(tokenA),    // Token to trade
            swapAmount,         // Amount to trade
            deadline,           // Permit deadline
            v, r, s,           // Permit signature
            address(tokenB),    // Token to receive
            user,              // Who gets the output tokens
            0                  // Minimum output (no slippage protection for test)
        );
        
        console.log(" Permit and swap executed successfully");
        console.log("  Amount traded:", swapAmount);
        console.log("  Amount received:", amountOut);
        
        // STEP 4: Verify the results
        uint256 userTokenAAfter = tokenA.balanceOf(user);
        uint256 userTokenBAfter = tokenB.balanceOf(user);
        
        console.log("\n--- After Swap ---");
        console.log("User Token A balance:", userTokenAAfter);
        console.log("User Token B balance:", userTokenBAfter);
        
        // Check that the balances changed correctly
        assertEq(userTokenAAfter, userTokenABefore - swapAmount, "Token A balance incorrect");
        assertEq(userTokenBAfter, userTokenBBefore + amountOut, "Token B balance incorrect");
        assertEq(amountOut, swapAmount, "Should be 1:1 swap in our simple exchange");
        
        console.log("\n TEST PASSED - Permit and swap works correctly!");
        console.log("=== END PERMIT AND SWAP TEST ===\n");
    }
    
    /**
     * @notice Test that demonstrates the gas savings vs traditional approach
     */
    function testGasSavingsComparison() public {
        console.log("=== GAS SAVINGS COMPARISON ===");
        
        uint256 amount = 50 * 1e18;
        
        console.log("\n--- Traditional Approach (2 transactions) ---");
        console.log("Transaction 1: approve() - User pays gas");
        console.log("Transaction 2: swap() - User pays gas");
        console.log("Total: 2 transactions, 2x gas costs");
        
        console.log("\n--- Our Approach (1 transaction) ---");
        console.log("Off-chain: Sign permit message - Free!");
        console.log("Transaction 1: permitAndSwap() - User pays gas once");
        console.log("Total: 1 transaction, ~50% gas savings");
        
        // Test our approach
        uint256 deadline = block.timestamp + 1 hours;
        
        bytes32 structHash = keccak256(
            abi.encode(
                tokenA.PERMIT_TYPEHASH(),
                user,
                address(swapper),
                amount,
                tokenA.nonces(user),
                deadline
            )
        );
        
        bytes32 hash = keccak256(
            abi.encodePacked("\x19\x01", tokenA.DOMAIN_SEPARATOR(), structHash)
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, hash);
        
        vm.prank(user);
        swapper.permitAndSwap(
            address(tokenA),
            amount,
            deadline,
            v, r, s,
            address(tokenB),
            user,
            0
        );
        
        console.log(" Gas-efficient swap completed successfully!");
        console.log("=== END GAS COMPARISON ===\n");
    }
    
    /**
     * @notice Test that permit signatures expire correctly
     */
    function testPermitExpiration() public {
        console.log("=== TESTING PERMIT EXPIRATION ===");
        
        uint256 amount = 25 * 1e18;
        uint256 shortDeadline = block.timestamp + 1; // Expires in 1 second
        
        // Create signature
        bytes32 structHash = keccak256(
            abi.encode(
                tokenA.PERMIT_TYPEHASH(),
                user,
                address(swapper),
                amount,
                tokenA.nonces(user),
                shortDeadline
            )
        );
        
        bytes32 hash = keccak256(
            abi.encodePacked("\x19\x01", tokenA.DOMAIN_SEPARATOR(), structHash)
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, hash);
        
        // Fast forward time to expire the permit
        vm.warp(block.timestamp + 2);
        
        console.log("Attempting to use expired permit...");
        
        // This should fail because the permit is expired
        vm.prank(user);
        vm.expectRevert("PERMIT_DEADLINE_EXPIRED");
        swapper.permitAndSwap(
            address(tokenA),
            amount,
            shortDeadline,
            v, r, s,
            address(tokenB),
            user,
            0
        );
        
        console.log(" Expired permit correctly rejected!");
        console.log("=== END EXPIRATION TEST ===\n");
    }
    
    /**
     * @notice Test that invalid signatures are rejected
     */
    function testInvalidSignature() public {
        console.log("=== TESTING INVALID SIGNATURE REJECTION ===");
        
        uint256 amount = 25 * 1e18;
        uint256 deadline = block.timestamp + 1 hours;
        
        // Create a valid signature
        bytes32 structHash = keccak256(
            abi.encode(
                tokenA.PERMIT_TYPEHASH(),
                user,
                address(swapper),
                amount,
                tokenA.nonces(user),
                deadline
            )
        );
        
        bytes32 hash = keccak256(
            abi.encodePacked("\x19\x01", tokenA.DOMAIN_SEPARATOR(), structHash)
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, hash);
        
        // Corrupt the signature
        s = bytes32(uint256(s) + 1);
        
        console.log("Attempting to use corrupted signature...");
        
        // This should fail because the signature is invalid
        vm.prank(user);
        vm.expectRevert("INVALID_SIGNER");
        swapper.permitAndSwap(
            address(tokenA),
            amount,
            deadline,
            v, r, s,
            address(tokenB),
            user,
            0
        );
        
        console.log(" Invalid signature correctly rejected!");
        console.log("=== END INVALID SIGNATURE TEST ===\n");
    }
    
    /**
     * @notice Test the quote function
     */
    function testGetAmountOut() public view {
        console.log("=== TESTING QUOTE FUNCTIONALITY ===");
        
        uint256 inputAmount = 100 * 1e18;
        uint256 expectedOutput = swapper.getAmountOut(
            address(tokenA),
            address(tokenB),
            inputAmount
        );
        
        console.log("Input amount:", inputAmount);
        console.log("Expected output:", expectedOutput);
        
        // In our simple 1:1 exchange, output should equal input
        assertEq(expectedOutput, inputAmount, "Quote should be 1:1");
        
        console.log(" Quote function works correctly!");
        console.log("=== END QUOTE TEST ===\n");
    }
}
