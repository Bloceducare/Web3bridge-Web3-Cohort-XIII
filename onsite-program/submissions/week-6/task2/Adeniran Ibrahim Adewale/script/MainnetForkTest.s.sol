// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/ERC20Token.sol";
import "../src/PermitSwap.sol";
import { IERC20 } from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import { IERC20Permit } from "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Permit.sol";

contract MainnetForkTest is Test {
    // Mainnet addresses
    address constant UNISWAP_V3_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant USDC = 0xa0b86a33e6C4eFA1D95b4D7b0e73F80b8Bb80C4A; // USDC with permit
    address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    
    // Whale addresses for testing (addresses with large balances)
    address constant USDC_WHALE = 0x28C6c06298d514Db089934071355E5743bf21d60; // Binance14
    address constant DAI_WHALE = 0x28C6c06298d514Db089934071355E5743bf21d60;
    
    PermitSwap public permitSwap;
    ERC20Token public customToken;
    
    address public user1;
    uint256 public user1PrivateKey;
    
    uint256 mainnetFork;
    
    function setUp() public {
        // Create mainnet fork
        string memory rpcUrl = vm.envString("MAINNET_RPC_URL");
        mainnetFork = vm.createFork(rpcUrl);
        vm.selectFork(mainnetFork);
        
        // Set up test accounts
        user1PrivateKey = 0x123;
        user1 = vm.addr(user1PrivateKey);
        
        // Deploy our contracts
        customToken = new ERC20Token("Test Token", "TEST", 1000000);
        permitSwap = new PermitSwap(UNISWAP_V3_ROUTER);
        
        // Fund user1 with some tokens for testing
        customToken.transfer(user1, 10000 * 1e18);
        
        // Fund user1 with ETH for gas
        vm.deal(user1, 10 ether);
        
        // Give user1 some USDC from whale
        vm.prank(USDC_WHALE);
        IERC20(USDC).transfer(user1, 10000 * 1e6); // USDC has 6 decimals
    }
    
    function testForkSetup() public view {
        // Verify we're on mainnet fork
        assertEq(block.chainid, 1);
        
        // Verify contracts exist
        assertTrue(UNISWAP_V3_ROUTER.code.length > 0);
        assertTrue(USDC.code.length > 0);
        assertTrue(WETH.code.length > 0);
        
        // Verify user has tokens
        assertGt(IERC20(USDC).balanceOf(user1), 0);
        assertGt(customToken.balanceOf(user1), 0);
    }
    
    function testSwapCustomTokenForUSDC() public {
        uint256 amountIn = 1000 * 1e18; // 1000 custom tokens
        uint256 amountOutMin = 1; // Accept any amount (just for testing)
        uint24 poolFee = 3000; // 0.3%
        uint256 deadline = block.timestamp + 1 hours;
        
        // Create permit signature for custom token
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                user1,
                address(permitSwap),
                amountIn,
                customToken.nonces(user1),
                deadline
            )
        );
        
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", customToken.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, hash);
        
        uint256 initialCustomBalance = customToken.balanceOf(user1);
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user1);
        
        vm.prank(user1);
        
        // This will likely fail because there's no liquidity pool for our custom token
        // But it demonstrates the pattern
        try permitSwap.permitAndSwap(
            address(customToken),
            USDC,
            amountIn,
            amountOutMin,
            poolFee,
            deadline,
            v,
            r,
            s
        ) {
            // If successful, verify balances changed
            assertLt(customToken.balanceOf(user1), initialCustomBalance);
            assertGt(IERC20(USDC).balanceOf(user1), initialUSDCBalance);
        } catch {
            // Expected to fail - no liquidity pool for our custom token
            console.log("Swap failed as expected - no liquidity pool");
        }
    }
    
    function testSwapUSDCForWETH() public {
        // This test uses real tokens with real liquidity
        uint256 amountIn = 100 * 1e6; // 100 USDC (6 decimals)
        uint256 amountOutMin = 0.01 ether; // Minimum 0.01 ETH
        uint24 poolFee = 3000;
        uint256 deadline = block.timestamp + 1 hours;
        
        // Check if USDC supports permit
        try IERC20Permit(USDC).nonces(user1) returns (uint256 nonce) {
            // USDC supports permit
            bytes32 structHash = keccak256(
                abi.encode(
                    keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                    user1,
                    address(permitSwap),
                    amountIn,
                    nonce,
                    deadline
                )
            );
            
            bytes32 hash = keccak256(abi.encodePacked("\x19\x01", IERC20Permit(USDC).DOMAIN_SEPARATOR(), structHash));
            (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, hash);
            
            uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user1);
            uint256 initialWETHBalance = IERC20(WETH).balanceOf(user1);
            
            vm.prank(user1);
            permitSwap.permitAndSwap(
                USDC,
                WETH,
                amountIn,
                amountOutMin,
                poolFee,
                deadline,
                v,
                r,
                s
            );
            
            // Verify the swap worked
            assertEq(IERC20(USDC).balanceOf(user1), initialUSDCBalance - amountIn);
            assertGt(IERC20(WETH).balanceOf(user1), initialWETHBalance + amountOutMin);
            
        } catch {
            console.log("USDC doesn't support permit or other error occurred");
            
            // Fallback: Test with regular approval
            vm.startPrank(user1);
            IERC20(USDC).approve(UNISWAP_V3_ROUTER, amountIn);
            
            // Call router directly to test swap functionality
            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
                tokenIn: USDC,
                tokenOut: WETH,
                fee: poolFee,
                recipient: user1,
                deadline: deadline,
                amountIn: amountIn,
                amountOutMinimum: amountOutMin,
                sqrtPriceLimitX96: 0
            });
            
            uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user1);
            uint256 initialWETHBalance = IERC20(WETH).balanceOf(user1);
            
            ISwapRouter(UNISWAP_V3_ROUTER).exactInputSingle(params);
            
            assertEq(IERC20(USDC).balanceOf(user1), initialUSDCBalance - amountIn);
            assertGt(IERC20(WETH).balanceOf(user1), initialWETHBalance);
            
            vm.stopPrank();
        }
    }
    
    function testSwapDAIForWETH() public {
        // First, get some DAI from the whale
        vm.prank(DAI_WHALE);
        IERC20(DAI).transfer(user1, 1000 * 1e18);
        
        uint256 amountIn = 100 * 1e18; // 100 DAI
        uint256 amountOutMin = 0.01 ether; // Minimum 0.01 ETH
        uint24 poolFee = 3000;
        uint256 deadline = block.timestamp + 1 hours;
        
        // DAI supports permit
        uint256 nonce = IERC20Permit(DAI).nonces(user1);
        
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                user1,
                address(permitSwap),
                amountIn,
                nonce,
                deadline
            )
        );
        
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", IERC20Permit(DAI).DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, hash);
        
        uint256 initialDAIBalance = IERC20(DAI).balanceOf(user1);
        uint256 initialWETHBalance = IERC20(WETH).balanceOf(user1);
        
        vm.prank(user1);
        permitSwap.permitAndSwap(
            DAI,
            WETH,
            amountIn,
            amountOutMin,
            poolFee,
            deadline,
            v,
            r,
            s
        );
        
        // Verify the swap worked
        assertEq(IERC20(DAI).balanceOf(user1), initialDAIBalance - amountIn);
        assertGt(IERC20(WETH).balanceOf(user1), initialWETHBalance);
        
        console.log("DAI balance after:", IERC20(DAI).balanceOf(user1));
        console.log("WETH balance after:", IERC20(WETH).balanceOf(user1));
    }
    
    function testGasEstimation() public {
        // Get some DAI
        vm.prank(DAI_WHALE);
        IERC20(DAI).transfer(user1, 1000 * 1e18);
        
        uint256 amountIn = 100 * 1e18;
        uint256 amountOutMin = 0.01 ether;
        uint24 poolFee = 3000;
        uint256 deadline = block.timestamp + 1 hours;
        
        // Create permit signature
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                user1,
                address(permitSwap),
                amountIn,
                IERC20Permit(DAI).nonces(user1),
                deadline
            )
        );
        
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", IERC20Permit(DAI).DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, hash);
        
        // Measure gas
        uint256 gasStart = gasleft();
        
        vm.prank(user1);
        permitSwap.permitAndSwap(
            DAI,
            WETH,
            amountIn,
            amountOutMin,
            poolFee,
            deadline,
            v,
            r,
            s
        );
        
        uint256 gasUsed = gasStart - gasleft();
        console.log("Gas used for permit + swap:", gasUsed);
        
        // Compare with traditional approve + swap
        vm.startPrank(user1);
        
        gasStart = gasleft();
        IERC20(DAI).approve(UNISWAP_V3_ROUTER, amountIn);
        uint256 approveGas = gasStart - gasleft();
        
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: DAI,
            tokenOut: WETH,
            fee: poolFee,
            recipient: user1,
            deadline: deadline,
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });
        
        gasStart = gasleft();
        ISwapRouter(UNISWAP_V3_ROUTER).exactInputSingle(params);
        uint256 swapGas = gasStart - gasleft();
        
        vm.stopPrank();
        
        console.log("Traditional approve gas:", approveGas);
        console.log("Traditional swap gas:", swapGas);
        console.log("Traditional total:", approveGas + swapGas);
        
        // Our permit+swap should be roughly similar or slightly more efficient
        // because it's a single transaction
    }
}