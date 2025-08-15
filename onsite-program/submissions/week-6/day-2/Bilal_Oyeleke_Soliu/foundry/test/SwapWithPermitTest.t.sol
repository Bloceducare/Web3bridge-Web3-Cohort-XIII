// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {SwapWithPermit} from "../src/SwapWithPermit.sol";
import {MockERC20Permit} from "../src/MockERC20Permit.sol";
import {MockUniswapRouter} from "../src/MockUniswapRouter.sol";

contract SwapWithPermitTest is Test {
    SwapWithPermit swapContract;
    MockERC20Permit tokenA;
    MockERC20Permit tokenB;
    MockUniswapRouter router;
    
    address user = makeAddr("user");
    uint256 userPrivateKey = 0x1234;
    
    function setUp() public {
        tokenA = new MockERC20Permit("Token A", "TKNA", 18);
        tokenB = new MockERC20Permit("Token B", "TKNB", 18);
        router = new MockUniswapRouter();
        swapContract = new SwapWithPermit(address(router));
        
        tokenA.mint(user, 1000 ether);
        tokenB.mint(address(router), 1000 ether);
        
        vm.prank(user);
        user = vm.addr(userPrivateKey);
        tokenA.mint(user, 1000 ether);
    }
    
    function testSwapWithPermit() public {
        uint256 amountIn = 100 ether;
        uint256 deadline = block.timestamp + 1 hours;
        
        bytes32 domainSeparator = tokenA.DOMAIN_SEPARATOR();
        uint256 nonce = tokenA.nonces(user);
        
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                user,
                address(swapContract),
                amountIn,
                nonce,
                deadline
            )
        );
        
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);
        
        SwapWithPermit.SwapParams memory swapParams = SwapWithPermit.SwapParams({
            tokenIn: address(tokenA),
            tokenOut: address(tokenB),
            amountIn: amountIn,
            amountOutMin: 90 ether,
            to: user,
            deadline: deadline
        });
        
        SwapWithPermit.PermitParams memory permitParams = SwapWithPermit.PermitParams({
            value: amountIn,
            deadline: deadline,
            v: v,
            r: r,
            s: s
        });
        
        uint256 tokenABalanceBefore = tokenA.balanceOf(user);
        uint256 tokenBBalanceBefore = tokenB.balanceOf(user);
        
        vm.prank(user);
        swapContract.swapWithPermit(swapParams, permitParams);
        
        assertEq(tokenA.balanceOf(user), tokenABalanceBefore - amountIn);
        assertEq(tokenB.balanceOf(user), tokenBBalanceBefore + 95 ether);
    }
}