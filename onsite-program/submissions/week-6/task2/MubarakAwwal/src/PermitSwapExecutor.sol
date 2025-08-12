// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PermitSwapExecutor {
    IUniswapV2Router02 public immutable router;

    constructor(address _router) {
        router = IUniswapV2Router02(_router);
    }

function permitAndSwap(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 amountOutMin,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external {
    // Permit
    IERC20Permit(tokenIn).permit(
        msg.sender,
        address(this),
        amountIn,
        deadline,
        v,
        r,
        s
    );

    // Transfer from user
    IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

    // Approve router
    IERC20(tokenIn).approve(address(router), amountIn);

    // Declare and initialize the path array
    address[]memory path=new address [](2);

    path[0] = tokenIn;
    path[1] = tokenOut;

    // Swap
    router.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        msg.sender,
        deadline
    );
}

}