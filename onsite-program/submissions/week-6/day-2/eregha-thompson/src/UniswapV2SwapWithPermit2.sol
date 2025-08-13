// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IPermit2} from "./interfaces/IPermit2.sol";
import {IUniswapV2Router} from "./interfaces/IUniswapV2Router.sol";

interface IERC20{
    function approve(address spender, uint256 amount) external returns (bool);
}

contract UniswapV2SwapWithPermit2{
    address public constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    address public constant UNIV2_ROUTER =0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

    function swapWithPermit2(
        address token,
        uint160 amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline,
        IPermit2.PermitSingle calldata permitSingle,
        bytes calldata sig
    ) external {
        IPermit2(PERMIT2).permit(msg.sender, permitSingle, sig);
        IPermit2(PERMIT2).transferFrom(msg.sender, address(this), amountIn, token);
        IERC20(token).approve(UNIV2_ROUTER, amountIn);
        IUniswapV2Router(UNIV2_ROUTER).swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );
    }
}