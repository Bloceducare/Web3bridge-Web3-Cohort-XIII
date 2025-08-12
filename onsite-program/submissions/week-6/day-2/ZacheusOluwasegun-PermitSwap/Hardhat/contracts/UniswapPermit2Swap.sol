// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/ISwapRouter.sol";
import "../interfaces/ISignatureTransfer.sol";

contract UniswapPermit2Swap {
    ISignatureTransfer public constant PERMIT2 = 
        ISignatureTransfer(0x000000000022D473030F116dDEE9F6B43aC78BA3);
    
    ISwapRouter public constant SWAP_ROUTER = 
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    /**
     * @dev Swap tokens using Permit2 - user only needs to sign permit
     * @param tokenIn Input token address
     * @param tokenOut Output token address  
     * @param fee Uniswap pool fee (500, 3000, 10000)
     * @param amountIn Amount of input tokens
     * @param amountOutMinimum Minimum amount of output tokens
     * @param deadline Transaction deadline
     * @param nonce Permit2 nonce
     * @param signature User's permit signature
     */
    function swapTokens(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint256 amountOutMinimum,
        uint256 deadline,
        uint256 nonce,
        bytes calldata signature
    ) external returns (uint256 amountOut) {
        
        // Step 1: Transfer tokens from user directly to router using Permit2
        PERMIT2.permitTransferFrom(
            ISignatureTransfer.PermitTransferFrom({
                permitted: ISignatureTransfer.TokenPermissions({
                    token: tokenIn,
                    amount: amountIn
                }),
                nonce: nonce,
                deadline: deadline
            }),
            ISignatureTransfer.SignatureTransferDetails({
                to: address(SWAP_ROUTER),
                requestedAmount: amountIn
            }),
            msg.sender,
            signature
        );

        // Step 2: Execute swap (router already has the tokens)
        amountOut = SWAP_ROUTER.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: fee,
                recipient: msg.sender,
                deadline: deadline,
                amountIn: amountIn,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0
            })
        );
    }
}