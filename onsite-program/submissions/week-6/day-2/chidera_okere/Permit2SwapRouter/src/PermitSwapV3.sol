// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "permit2/src/interfaces/ISignatureTransfer.sol";


contract PermitSwapV3 {

    ISignatureTransfer public immutable permit2;

   
    ISwapRouter public immutable swapRouter;

   
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(address _permit2, address _swapRouter) {
        permit2 = ISignatureTransfer(_permit2);
        swapRouter = ISwapRouter(_swapRouter);
    }

    /// @notice Executes a Uniswap V3 token swap using a signed Permit2 transfer
    /// @param permit The signed permit data
    /// @param signature The EIP-712 signature from the token owner
    /// @param tokenIn Input token address
    /// @param tokenOut Output token address
    /// @param fee Pool fee tier (e.g., 3000 for 0.3%)
    /// @param amountOutMin Minimum output amount
    /// @param recipient Recipient of output tokens
    /// @param deadline Swap deadline timestamp
    /// @param sqrtPriceLimitX96 Price limit for the swap
    function permitAndSwap(
        ISignatureTransfer.PermitTransferFrom calldata permit,
        bytes calldata signature,
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountOutMin,
        address recipient,
        uint256 deadline,
        uint160 sqrtPriceLimitX96
    ) external returns (uint256 amountOut) {
        require(block.timestamp <= deadline, "Transaction expired");
        require(permit.permitted.token == tokenIn, "Token mismatch");
        require(recipient != address(0), "Invalid recipient");

        // Transfer tokens to this contract using Permit2
        permit2.permitTransferFrom(
            permit,
            ISignatureTransfer.SignatureTransferDetails({
                to: address(this),
                requestedAmount: permit.permitted.amount
            }),
            msg.sender,
            signature
        );

        // Approve Uniswap router
        IERC20(tokenIn).approve(address(swapRouter), permit.permitted.amount);

        // Execute swap
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: recipient,
            deadline: deadline,
            amountIn: permit.permitted.amount,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: sqrtPriceLimitX96
        });

        amountOut = swapRouter.exactInputSingle(params);

        // Reset approval
        IERC20(tokenIn).approve(address(swapRouter), 0);

        // Emit event
        emit SwapExecuted(msg.sender, tokenIn, tokenOut, permit.permitted.amount, amountOut);

        return amountOut;
    }
}