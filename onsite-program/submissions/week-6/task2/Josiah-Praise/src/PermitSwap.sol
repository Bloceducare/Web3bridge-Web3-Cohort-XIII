// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "v2-periphery/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "permit2/src/interfaces/ISignatureTransfer.sol";



contract PermitSwap {
    ISignatureTransfer public permit2;

    IUniswapV2Router02 public uniswapRouter;

    constructor(address _permit2, address _uniswapRouter) {
        permit2 = ISignatureTransfer(_permit2);
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
    }

    function permitAndSwap(
        ISignatureTransfer.PermitTransferFrom calldata permit,
        bytes calldata signature,
        address[] calldata path,
        uint amountOutMin,
        address to,
        uint deadline
    ) external {
        permit2.permitTransferFrom(
            permit,
            ISignatureTransfer.SignatureTransferDetails({
                to: address(this),
                requestedAmount: permit.permitted.amount
            }),
            msg.sender,
            signature
        );

        IERC20(path[0]).approve(address(uniswapRouter), permit.permitted.amount);

        uniswapRouter.swapExactTokensForTokens(
            permit.permitted.amount,
            amountOutMin,
            path,
            to,
            deadline
        );
    }
}