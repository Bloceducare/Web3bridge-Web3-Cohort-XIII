// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IPermit2} from "./interfaces/IPermit2.sol";
import {IUniswapV2Router02} from "./interfaces/IUniswapV2Router02.sol";
import {IERC20} from "./interfaces/IERC20.sol";

contract Permit2Swap {
    IPermit2 public immutable permit2;
    IUniswapV2Router02 public immutable uniswapRouter;

    constructor(address _permit2, address _uniswapRouter) {
        permit2 = IPermit2(_permit2);
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
    }

    function permitAndSwap(
        IPermit2.PermitTransferFrom calldata permit,
        IPermit2.SignatureTransferDetails calldata transferDetails,
        address owner,
        bytes calldata signature,
        address[] calldata path,
        uint256 amountOutMin,
        uint256 deadline
    ) external {
        permit2.permitTransferFrom(permit, transferDetails, owner, signature);

        IERC20(path[0]).approve(address(uniswapRouter), transferDetails.requestedAmount);

        uniswapRouter.swapExactTokensForTokens(
            transferDetails.requestedAmount,
            amountOutMin,
            path,
            owner,
            deadline
        );
    }
}