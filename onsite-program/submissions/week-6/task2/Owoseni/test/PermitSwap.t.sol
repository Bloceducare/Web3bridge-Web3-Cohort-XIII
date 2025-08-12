// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/uniswap.sol";

contract PermitSwapTest is Test {
    address public swapRouter;
    
    constructor(address _swapRouter) {
        swapRouter = _swapRouter;
    }
    
    function swapWithPermit(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint256 amountOutMinimum,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external pure returns (uint256) {
        return amountIn;
    }
}

contract PermitSwapTes is Test {
    PermitSwap public permitSwap;
    
    address constant UNISWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address constant USDC = 0xa0b86a33e6BA115aE3C24b41B1e6aF09c2cFe28e;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    
    function setUp() public {
        console.log("Setting up PermitSwap test...");
        
        permitSwap = new PermitSwap(UNISWAP_ROUTER);
        
        console.log("PermitSwap deployed at:", address(permitSwap));
        // console.log("SwapRouter set to:", permitSwap.swapRouter());
    }
    
    function testDeployment() public {
        console.log("Testing contract deployment...");
        
        // assertEq(permitSwap.swapRouter(), UNISWAP_ROUTER);
        assertTrue(address(permitSwap) != address(0));
        
        console.log("Deployment test passed!");
    }
    
    function testSwapWithPermitBasic() public {
        console.log("Testing basic swap with permit...");
        
        uint256 amountIn = 1000e6; // 1000 USDC
        uint256 minAmountOut = 0.3 ether; // 0.3 ETH minimum
        uint256 deadline = block.timestamp + 300; // 5 minutes
        
        // Mock signature components
        uint8 v = 27;
        bytes32 r = bytes32(uint256(1));
        bytes32 s = bytes32(uint256(2));
        
        // Call the function
        uint256 result = permitSwap.swapWithPermit(
            USDC,
            WETH,
            3000, // 0.3% fee
            amountIn,
            minAmountOut,
            deadline,
            v,
            r,
            s
        );
        
        // Verify result
        assertEq(result, amountIn);
        
        console.log("Input amount:", amountIn);
        console.log("Output amount:", result);
        console.log("Basic swap test passed!");
    }
    
    function testSwapWithDifferentAmounts() public {
        console.log("Testing swap with different amounts...");
        
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100e6;   // 100 USDC
        amounts[1] = 500e6;   // 500 USDC  
        amounts[2] = 1000e6;  // 1000 USDC
        
        for (uint256 i = 0; i < amounts.length; i++) {
            uint256 amountIn = amounts[i];
            uint256 deadline = block.timestamp + 300;
            
            uint256 result = permitSwap.swapWithPermit(
                USDC,
                WETH,
                3000,
                amountIn,
                0, // No minimum for test
                deadline,
                27, bytes32(uint256(1)), bytes32(uint256(2))
            );
            
            assertEq(result, amountIn);
            console.log("Amount", i + 1, ":", amountIn, "->", result, "");
        }
        
        console.log("Different amounts test passed!");
    }
    
    function testSwapWithDifferentTokens() public {
        console.log("Testing swap with different token pairs...");
        
        address[] memory tokenPairs = new address[](4);
        tokenPairs[0] = USDC;
        tokenPairs[1] = WETH;
        tokenPairs[2] = 0x6B175474E89094C44Da98b954EedeAC495271d0F; // DAI
        tokenPairs[3] = 0xA0b86a33E6Ba115ae3C24b41B1e6Af09c2cFE28E; // USDT
        
        uint256 amountIn = 1000e6;
        uint256 deadline = block.timestamp + 300;
        
        for (uint256 i = 0; i < tokenPairs.length - 1; i++) {
            uint256 result = permitSwap.swapWithPermit(
                tokenPairs[i],
                tokenPairs[i + 1],
                3000,
                amountIn,
                0,
                deadline,
                27, bytes32(uint256(1)), bytes32(uint256(2))
            );
            
            assertEq(result, amountIn);
            console.log("Token pair", i + 1, "test passed");
        }
        
        console.log("Different token pairs test passed!");
    }
    
    function testFuzzSwapAmounts(uint256 amountIn) public {
        // Bound the fuzz input to reasonable values
        amountIn = bound(amountIn, 1e6, 1000000e6); // 1 USDC to 1M USDC
        
        uint256 deadline = block.timestamp + 300;
        
        uint256 result = permitSwap.swapWithPermit(
            USDC,
            WETH,
            3000,
            amountIn,
            0,
            deadline,
            27, bytes32(uint256(1)), bytes32(uint256(2))
        );
        
        assertEq(result, amountIn);
        console.log("Fuzz test passed for amount:", amountIn);
    }
    
    function testMultipleUsers() public {
        console.log("Testing multiple users...");
        
        uint256 amountIn = 1000e6;
        uint256 deadline = block.timestamp + 300;
        
        // Test with alice
        vm.prank(alice);
        uint256 resultAlice = permitSwap.swapWithPermit(
            USDC, WETH, 3000, amountIn, 0, deadline,
            27, bytes32(uint256(1)), bytes32(uint256(2))
        );
        
        // Test with bob
        vm.prank(bob);
        uint256 resultBob = permitSwap.swapWithPermit(
            USDC, WETH, 3000, amountIn, 0, deadline,
            27, bytes32(uint256(1)), bytes32(uint256(2))
        );
        
        assertEq(resultAlice, amountIn);
        assertEq(resultBob, amountIn);
        
        console.log("Alice result:", resultAlice);
        console.log("Bob result:", resultBob);
        console.log("Multiple users test passed!");
    }
    
    function testContractState() public {
        console.log("Testing contract state...");
        
        // Verify initial state
        assertEq(permitSwap.swapRouter(), UNISWAP_ROUTER);
        
        // Contract should not hold any ETH initially
        assertEq(address(permitSwap).balance, 0);
        
                console.log("Contract state test passed!");
    }
    
    // Helper function to demonstrate test utilities
    function testHelperFunctions() public {
        console.log("Testing helper functions...");
        
        // Test makeAddr
        address testUser = makeAddr("testUser");
        assertTrue(testUser != address(0));
        
        // Test vm.deal (give ETH to address)
        vm.deal(testUser, 1 ether);
        assertEq(testUser.balance, 1 ether);
        
        // Test vm.warp (change timestamp)
        uint256 originalTime = block.timestamp;
        vm.warp(originalTime + 1000);
        assertEq(block.timestamp, originalTime + 1000);
        
        console.log("Helper functions test passed!");
    }
}


