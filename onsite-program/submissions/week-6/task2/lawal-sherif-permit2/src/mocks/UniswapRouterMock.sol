// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IERC20.sol";

interface IERC20Mock {
    function mint(address to, uint256 amount) external;
}

contract UniswapRouterMock {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        require(path.length >= 2, "Invalid path");
        require(deadline >= block.timestamp, "Expired deadline");
        
        address tokenIn = path[0];
        address tokenOut = path[path.length - 1];
        
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        uint amountOut = (amountIn * 80) / 100;
        require(amountOut >= amountOutMin, "Insufficient output amount");
        
        IERC20Mock(tokenOut).mint(to, amountOut);
        
        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        amounts[path.length - 1] = amountOut;
        
        return amounts;
    }
}