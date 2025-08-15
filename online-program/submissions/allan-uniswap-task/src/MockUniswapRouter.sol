// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockUniswapRouter
 * @dev Mock implementation of Uniswap V2 Router for testing purposes
 * 
 * This contract simulates the basic functionality of Uniswap V2 Router
 * for testing the permit + swap functionality. It implements a simple
 * 1:1 swap ratio for demonstration purposes.
 */
contract MockUniswapRouter {
    // Simple exchange rate: 1 tokenIn = 1 tokenOut (for testing)
    uint256 public constant EXCHANGE_RATE = 1;
    
    // Events
    event SwapExecuted(
        uint amountIn,
        uint amountOut,
        address[] path,
        address to
    );

    /**
     * @dev Swap exact tokens for tokens (simplified implementation)
     * @param amountIn Amount of input tokens
     * @param amountOutMin Minimum amount of output tokens
     * @param path Array of token addresses [tokenIn, tokenOut]
     * @param to Address to receive output tokens
     * @param deadline Transaction deadline
     * @return amounts Array of amounts [amountIn, amountOut]
     */
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        require(block.timestamp <= deadline, "Router: EXPIRED");
        require(path.length >= 2, "Router: INVALID_PATH");
        require(amountIn > 0, "Router: INSUFFICIENT_INPUT_AMOUNT");

        address tokenIn = path[0];
        address tokenOut = path[path.length - 1];
        
        // Calculate output amount (1:1 ratio for simplicity)
        uint amountOut = amountIn * EXCHANGE_RATE;
        require(amountOut >= amountOutMin, "Router: INSUFFICIENT_OUTPUT_AMOUNT");

        // Transfer input tokens from sender
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        // Transfer output tokens to recipient
        IERC20(tokenOut).transfer(to, amountOut);

        // Return amounts array
        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOut;

        emit SwapExecuted(amountIn, amountOut, path, to);
    }

    /**
     * @dev Get amounts out for a given input amount
     * @param amountIn Input amount
     * @param path Array of token addresses
     * @return amounts Array of amounts [amountIn, amountOut]
     */
    function getAmountsOut(uint amountIn, address[] calldata path)
        external pure returns (uint[] memory amounts) {
        require(path.length >= 2, "Router: INVALID_PATH");
        
        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = amountIn * EXCHANGE_RATE; // 1:1 ratio
    }

    /**
     * @dev Add liquidity to the mock router (for testing)
     * @param token Token address to add liquidity for
     * @param amount Amount of tokens to add
     */
    function addLiquidity(address token, uint256 amount) external {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
    }

    /**
     * @dev Get token balance in the router
     * @param token Token address
     * @return balance Token balance
     */
    function getTokenBalance(address token) external view returns (uint256 balance) {
        return IERC20(token).balanceOf(address(this));
    }
}
