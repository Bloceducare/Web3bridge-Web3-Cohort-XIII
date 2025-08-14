// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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


interface IUniswap {
    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
}

contract PermitSwapHelper {
    address public immutable router;

    constructor(address _router) {
        router = _router;
    }

    function permitAndSwap(
        address token,
        address owner,
        uint256 amountIn,
        uint256 permitDeadline,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 swapDeadline
    ) external {
        IERC20Permit(token).permit(owner, router, amountIn, permitDeadline, v, r, s);

        IUniswap(router).swapExactTokensForTokensSupportingFeeOnTransferTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            swapDeadline
        );
    }
}
