// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IERC20.sol";
import "./interfaces/IERC20Permit.sol";
import "./interfaces/IUniswapV2Router02.sol";

contract PermitSwap {
    address public immutable router;

    constructor(address _router) {
        router = _router;
    }

    function swapWithPermit(
        address token,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 swapDeadline,
        uint256 permitDeadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(path.length >= 2, "invalid path");
        require(path[0] == token, "path must start with token");

        IERC20Permit(token).permit(
            msg.sender,
            address(this),
            amountIn,
            permitDeadline,
            v,
            r,
            s
        );

        bool ok = IERC20(token).transferFrom(
            msg.sender,
            address(this),
            amountIn
        );
        require(ok, "transferFrom failed");

        require(IERC20(token).approve(router, amountIn), "approve failed");

        IUniswapV2Router02(router).swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            swapDeadline
        );
    }
}
