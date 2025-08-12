// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function approve(address spender, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

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
    address public constant UNISWAP_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

    function permitAndSwap(
        address owner,
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        uint256 minAmountOut,
        address recipient,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        IERC20Permit(tokenIn).permit(owner, address(this), amountIn, deadline, v, r, s);
        IERC20(tokenIn).transferFrom(owner, address(this), amountIn);
        IERC20(tokenIn).approve(UNISWAP_ROUTER, amountIn);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        IUniswapV2Router02(UNISWAP_ROUTER).swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            recipient,
            block.timestamp
        );
    }
}