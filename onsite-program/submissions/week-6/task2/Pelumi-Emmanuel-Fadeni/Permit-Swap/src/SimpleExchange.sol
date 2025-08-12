// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./SimpleTokenWithPermit.sol";

/**
 * @title SimpleExchange
 * @notice A simplified Uniswap-like token exchange
 * 
 * This contract allows users to swap one token for another
 * In a real Uniswap, this would involve liquidity pools and complex pricing
 * For simplicity, we're doing a 1:1 swap
 */
contract SimpleExchange {
    
    event TokenSwap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    /**
     * @notice Swap one token for another
     * 
     * This is a simplified version of Uniswap's swap function
     * In reality, Uniswap has much more complex pricing based on liquidity pools
     * 
     * @param tokenIn The token we're giving up
     * @param tokenOut The token we want to receive
     * @param amountIn How much of tokenIn we're giving
     * @param to Who should receive the output tokens
     * @return amountOut How much of tokenOut we received
     */
    function swapTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address to
    ) external returns (uint256 amountOut) {
        // Get references to both tokens
        SimpleTokenWithPermit inputToken = SimpleTokenWithPermit(tokenIn);
        SimpleTokenWithPermit outputToken = SimpleTokenWithPermit(tokenOut);
        
        // Make sure the tokens are different
        require(tokenIn != tokenOut, "Cannot swap same token");
        require(amountIn > 0, "Amount must be greater than 0");
        
        // Take the input tokens from the user
        // Note: The user must have approved this contract to spend their tokens
        inputToken.transferFrom(msg.sender, address(this), amountIn);
        
        // For simplicity, we're doing a 1:1 swap
        // In real Uniswap, this would be calculated based on:
        // - Liquidity pool reserves
        // - Trading fees
        // - Slippage protection
        amountOut = amountIn;
        
        // Give the user output tokens
        // In a real exchange, these would come from a liquidity pool
        // For testing, we just mint new tokens
        outputToken.mint(to, amountOut);
        
        emit TokenSwap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
        
        return amountOut;
    }
    
    /**
     * @notice Get a quote for how many tokens you'd receive in a swap
     * @param tokenIn The token you want to trade
     * @param tokenOut The token you want to receive  
     * @param amountIn How much you want to trade
     * @return amountOut How much you would receive
     */
    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external pure returns (uint256 amountOut) {
        // Prevent unused variable warnings
        tokenIn;
        tokenOut;
        
        // Simple 1:1 exchange rate
        // In real Uniswap, this would calculate based on current pool reserves
        return amountIn;
    }
}