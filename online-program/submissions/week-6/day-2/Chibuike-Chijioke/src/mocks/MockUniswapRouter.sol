// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "interfaces/IUniswapRouter.sol";

// Mock for Uniswap Router to simulate swapExactTokensForTokens
contract MockUniswapRouter is IUniswapRouter {
    event SwapExecuted(uint256 amountIn, uint256 amountOutMin, address[] path, address to);

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external override returns (uint[] memory amounts) {
        require(block.timestamp <= deadline, "Deadline passed");
        emit SwapExecuted(amountIn, amountOutMin, path, to);
        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOutMin;
    }
}