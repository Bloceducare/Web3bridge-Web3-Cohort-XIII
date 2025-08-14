// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IERC20} from "interfaces/IERC20.sol";
import {IUniswapRouter} from "interfaces/IUniswapRouter.sol";
import {ISignatureTransfer} from "permit2/interfaces/ISignatureTransfer.sol";
import {IPermit2} from "permit2/interfaces/IPermit2.sol";

contract Permit2SwapAndExecute {
    IPermit2 public immutable permit2;
    IUniswapRouter public immutable uniswapRouter;

    constructor(address _permit2, address _uniswapRouter) {
        permit2 = IPermit2(_permit2);
        uniswapRouter = IUniswapRouter(_uniswapRouter);
    }

    // This executes a uniswap swap using Permit2 signature-based approval

    function permitAndSwap(
        ISignatureTransfer.PermitTransferFrom calldata permit,
        ISignatureTransfer.SignatureTransferDetails calldata transferDetails,
        bytes calldata signature,
        address[] calldata path,
        uint256 amountOutMin
    ) external {
        permit2.permitTransferFrom(
            permit, transferDetails, msg.sender, signature
        );

        // This approve uniswap router to spend tokens
        address tokenIn = path[0];
        IERC20(tokenIn).approve(address(uniswapRouter), transferDetails.requestedAmount);

        // This perform the swap
        uniswapRouter.swapExactTokensForTokens(
            transferDetails.requestedAmount, amountOutMin, path, msg.sender, block.timestamp
        ); 
    }
}