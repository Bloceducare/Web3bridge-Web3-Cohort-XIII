// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

contract MainnetForkTest is Test {
    // Mainnet addresses
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    
    // Uniswap V2 Router
    address constant ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    
    // Test user
    address user = makeAddr("user");
    
    function setUp() public {
        // Fork mainnet at specific block for consistency
        string memory rpcUrl = vm.envString("MAINNET_RPC_URL");
        vm.createAndSelectFork(rpcUrl, 19000000);
        
        // Give user some tokens to work with
        deal(USDC, user, 10000e6);  // 10,000 USDC
        deal(WETH, user, 10e18);    // 10 WETH
    }
    
    function testRealUniswapSwap() public {
        vm.startPrank(user);
        
        // Check initial balances
        uint256 usdcBefore = IERC20(USDC).balanceOf(user);
        uint256 daiBefore = IERC20(DAI).balanceOf(user);
        
        console.log("USDC before:", usdcBefore);
        console.log("DAI before:", daiBefore);
        

        IERC20(USDC).approve(ROUTER, 1000e6);

        address[] memory path = new address[](2);
        path[0] = USDC;
        path[1] = DAI;
        
  
        IUniswapV2Router(ROUTER).swapExactTokensForTokens(
            1000e6,         
            0,              
            path,
            user,
            block.timestamp + 300
        );

        uint256 usdcAfter = IERC20(USDC).balanceOf(user);
        uint256 daiAfter = IERC20(DAI).balanceOf(user);
        
        console.log("USDC after:", usdcAfter);
        console.log("DAI after:", daiAfter);
        
        // Assertions
        assertEq(usdcAfter, usdcBefore - 1000e6, "USDC should decrease by 1000");
        assertGt(daiAfter, daiBefore, "Should receive some DAI");
        
        vm.stopPrank();
    }
    
    function testWhaleInteraction() public {
        // Use a real whale address (Binance)
        address whale = 0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503;
        
        // Check whale's real balance
        uint256 whaleBalance = IERC20(USDC).balanceOf(whale);
        console.log("Whale USDC balance:", whaleBalance);
        
        // Impersonate the whale
        vm.prank(whale);
        IERC20(USDC).transfer(user, 1000e6);
        
        // Verify transfer worked
        assertGe(IERC20(USDC).balanceOf(user), 1000e6);
    }
    
    function testForkAtSpecificBlock() public {
        // You can also fork at specific blocks for historical data
        vm.createFork(vm.envString("MAINNET_RPC_URL"), 18500000);
        
        // Now you're at block 18,500,000 - test historical state
        uint256 blockNumber = block.number;
        console.log("Current block:", blockNumber);
        assertEq(blockNumber, 18500000);
    }
    
    function testMultipleContracts() public {
        // Test interactions with multiple real contracts
        
        // 1. Check USDC total supply
        uint256 totalSupply = IERC20(USDC).balanceOf(address(0));
        // Better way:
        (bool success, bytes memory data) = USDC.staticcall(
            abi.encodeWithSignature("totalSupply()")
        );
        if (success) {
            uint256 supply = abi.decode(data, (uint256));
            console.log("USDC total supply:", supply);
        }
        
        // 2. Check current block info
        console.log("Block number:", block.number);
        console.log("Block timestamp:", block.timestamp);
        console.log("Coinbase:", block.coinbase);
    }
    
}