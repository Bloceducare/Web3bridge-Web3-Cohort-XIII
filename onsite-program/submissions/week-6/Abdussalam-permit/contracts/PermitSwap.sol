// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../Interfaces/Interface.sol";

interface IERC20Permit is IERC20 {
    // Permit function allows approvals via off-chain EIP-712 signatures
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    // Returns current nonce for owner, used in permit signature
    function nonces(address owner) external view returns (uint256);

    // Domain separator for EIP-712 signature scheme
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

contract PermitSwap {
    ISwapRouter public immutable swapRouter;

    constructor(address _swapRouter) {
        swapRouter = ISwapRouter(_swapRouter);
    }

    /// @notice Swaps tokens using a permit to approve the swap contract
    /// @param tokenIn The address of the input token
    /// @param tokenOut The address of the output token
    /// @param fee The fee tier for the Uniswap pool
    /// @param amountIn The amount of input tokens to swap
    /// @param amountOutMinimum The minimum amount of output tokens to receive
    /// @param deadline The deadline for the swap transaction
    /// @param v The recovery byte of the EIP-712 signature
    /// @param r The r value of the EIP-712 signature
    /// @param s The s value of the EIP-712 signature
    /// @return amountOut The amount of output tokens received from the swap
    /// @dev This function uses the permit function to approve the swap contract to spend the input tokens.
    /// It then transfers the input tokens from the sender to this contract and performs the swap
    /// using Uniswap's exactInputSingle function.
    /// The function assumes that the input token implements the IERC20Permit interface.
    /// The swapRouter must be set to a valid Uniswap V3 router address.
    /// The function will revert if the permit signature is invalid or if the swap fails.
   
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
    ) external returns (uint256 amountOut) {
        // Call permit on the input token to approve this contract
        IERC20Permit(tokenIn).permit(
            msg.sender,
            address(this),
            amountIn,
            deadline,
            v,
            r,
            s
        );

        // Transfer tokens from sender to this contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Approve Uniswap router to spend the tokens
        IERC20(tokenIn).approve(address(swapRouter), amountIn);

        // Prepare swap parameters for Uniswap exactInputSingle call
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: msg.sender,
            deadline: deadline,
            amountIn: amountIn,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: 0
        });

        // Execute the swap on Uniswap
        amountOut = swapRouter.exactInputSingle(params);
    }
}
