// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./SimpleTokenWithPermit.sol";
import "./SimpleExchange.sol";

/**
 * @title PermitSwapper
 * @notice The main contract that combines permit + swap functionality
 * 
 * This is the magic contract that allows users to:
 * 1. Sign a permit message off-chain (no gas cost)
 * 2. Submit permit + swap in one transaction (saves gas)
 * 
 * Instead of:
 * - Transaction 1: approve() 
 * - Transaction 2: swap()
 * 
 * Users can now do:
 * - Sign permit off-chain (free)
 * - Transaction 1: permitAndSwap() (does everything)
 */
contract PermitSwapper {
    SimpleExchange public immutable exchange;
    
    event PermitAndSwap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    /**
     * @notice Constructor
     * @param _exchange Address of the exchange contract to use for swaps
     */
    constructor(address _exchange) {
        require(_exchange != address(0), "Exchange address cannot be zero");
        exchange = SimpleExchange(_exchange);
    }
    
    /**
     * @notice The main function - permit and swap in one transaction
     * 
     * This function:
     * 1. Uses a permit signature to approve token spending (no prior transaction needed)
     * 2. Transfers tokens from user to this contract
     * 3. Approves the exchange to spend the tokens
     * 4. Executes the swap
     * 
     * All of this happens in ONE transaction!
     * 
     * @param tokenIn Token to spend/trade
     * @param amount Amount of tokenIn to trade
     * @param deadline When the permit expires
     * @param v Part of the permit signature
     * @param r Part of the permit signature  
     * @param s Part of the permit signature
     * @param tokenOut Token to receive
     * @param to Address that should receive the output tokens
     * @param minAmountOut Minimum amount of tokenOut to receive (slippage protection)
     * @return amountOut Actual amount of tokenOut received
     */
    function permitAndSwap(
        // Permit parameters
        address tokenIn,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s,
        // Swap parameters
        address tokenOut,
        address to,
        uint256 minAmountOut
    ) external returns (uint256 amountOut) {
        // Get reference to the input token
        SimpleTokenWithPermit token = SimpleTokenWithPermit(tokenIn);
        
        // STEP 1: Use the permit signature to approve this contract
        // This is equivalent to the user calling approve(), but using a signature
        // The signature was created off-chain, so no gas was spent on approval
        token.permit(
            msg.sender,     // The token owner (person calling this function)
            address(this),  // This contract gets approval to spend tokens
            amount,         // Amount to approve
            deadline,       // When the permit expires
            v, r, s        // The signature components
        );
        
        // STEP 2: Transfer tokens from user to this contract
        // Now that we have approval, we can transfer the user's tokens
        token.transferFrom(msg.sender, address(this), amount);
        
        // STEP 3: Approve the exchange to spend our tokens
        // The exchange needs permission to take the tokens from us
        token.approve(address(exchange), amount);
        
        // STEP 4: Execute the swap
        // Trade tokenIn for tokenOut using the exchange
        amountOut = exchange.swapTokens(tokenIn, tokenOut, amount, to);
        
        // STEP 5: Check slippage protection
        // Make sure we received at least the minimum expected amount
        require(amountOut >= minAmountOut, "INSUFFICIENT_OUTPUT_AMOUNT");
        
        emit PermitAndSwap(msg.sender, tokenIn, tokenOut, amount, amountOut);
        
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
    ) external view returns (uint256 amountOut) {
        return exchange.getAmountOut(tokenIn, tokenOut, amountIn);
    }
    
    /**
     * @notice Emergency function to recover any tokens sent to this contract
     * @param token Address of the token to recover
     * @param to Address to send the recovered tokens to
     * @param amount Amount of tokens to recover
     */
    function recoverToken(address token, address to, uint256 amount) external {
        // In a production contract, you'd want proper access control here
        // For now, anyone can recover tokens to prevent them from being stuck
        SimpleTokenWithPermit(token).transfer(to, amount);
    }
}