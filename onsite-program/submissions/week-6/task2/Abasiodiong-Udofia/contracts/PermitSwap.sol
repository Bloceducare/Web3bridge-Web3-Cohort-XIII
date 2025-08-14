// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Permit {
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    function approve(address spender, uint256 amount) external returns (bool);
}

interface IUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

contract PermitSwap {
    address public immutable uniswapRouter;

    constructor(address _uniswapRouter) {
        uniswapRouter = _uniswapRouter;
    }

    function permitAndSwap(
        address permitter,
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut,
        address[] calldata path,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(amountIn > 0, "AmountIn must be greater than 0");
        require(path.length >= 2, "Invalid swap path");
        require(deadline >= block.timestamp, "Deadline expired");

        
        IERC20Permit(tokenIn).permit(permitter, address(this), amountIn, deadline, v, r, s);

        
        IERC20Permit(tokenIn).transferFrom(permitter, address(this), amountIn);

        
        IERC20Permit(tokenIn).approve(uniswapRouter, amountIn);

        
        IUniswapV2Router02(uniswapRouter).swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            permitter,
            deadline
        );
    }
}