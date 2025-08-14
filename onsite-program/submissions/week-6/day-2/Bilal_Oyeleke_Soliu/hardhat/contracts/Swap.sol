// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IUniswapV3Router.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IERC20Permit.sol";

contract PermitAndSwapV3 {
    ISwapRouter public immutable swapRouter;

    event PermitAndSwap(address indexed owner, address tokenIn, uint256 amountIn, address tokenOut, uint256 amountOut);

    constructor(address _swapRouter) {
        require(_swapRouter != address(0), "zero router");
        swapRouter = ISwapRouter(_swapRouter);
    }

    /// permit -> transferFrom -> approve router -> exactInputSingle
    function permitAndSwapSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        address owner,
        uint256 amountIn,
        uint256 amountOutMinimum,
        uint256 permitDeadline,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint160 sqrtPriceLimitX96,
        uint256 swapDeadline,
        address recipient
    ) external returns (uint256 amountOut) {
        require(amountIn > 0, "amountIn==0");
        require(owner != address(0), "owner zero");

        // 1) consume permit (sets allowance of this contract)
        IERC20Permit(tokenIn).permit(owner, address(this), amountIn, permitDeadline, v, r, s);

        // 2) pull tokens from owner
        bool ok = IERC20(tokenIn).transferFrom(owner, address(this), amountIn);
        require(ok, "transferFrom failed");

        // 3) approve Uniswap router
        require(IERC20(tokenIn).approve(address(swapRouter), amountIn), "approve failed");

        // 4) swap
        ExactInputSingleParams memory params = ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: recipient,
            deadline: swapDeadline,
            amountIn: amountIn,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: sqrtPriceLimitX96
        });

        amountOut = swapRouter.exactInputSingle(params);

        emit PermitAndSwap(owner, tokenIn, amountIn, tokenOut, amountOut);
    }
}