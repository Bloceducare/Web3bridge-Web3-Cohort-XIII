// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract MockUniswapRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        // uint256 amountOutMin,
        address[] calldata path,
        // address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "Deadline expired");
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        amounts = new uint256[](path.length);
        amounts[path.length - 1] = amountIn;
        return amounts;
    }
}