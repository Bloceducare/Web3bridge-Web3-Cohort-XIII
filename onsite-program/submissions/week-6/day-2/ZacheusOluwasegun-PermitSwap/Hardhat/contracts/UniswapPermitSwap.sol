// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IUniswapV2Router02.sol";

contract UniswapPermit1Swap {
    IUniswapV2Router02 public constant uniswapRouter = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
        

    /**
     * @dev Swap tokens using permit signature (no prior approve needed)
     * @param tokenIn Input token address
     * @param amountIn Amount of input tokens
     * @param amountOutMin Minimum amount of output tokens
     * @param path Array of token addresses for swap path
     * @param to Recipient address
     * @param deadline Transaction deadline
     * @param v Permit signature v
     * @param r Permit signature r
     * @param s Permit signature s
     */
    function swapWithPermit(
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        // require(path[0] == tokenIn, "Invalid path");
        require(deadline >= block.timestamp, "Expired deadline");
        
        // Get token nonce for permit
        IERC20Permit token = IERC20Permit(tokenIn);
        
        // Call permit to approve Uniswap router directly to spend user's tokens
        token.permit(
            msg.sender,              // owner
            address(uniswapRouter),  // spender (Uniswap router)
            amountIn,                // value
            deadline,                // deadline
            v, r, s                 // signature
        );
        
        // Execute the swap - router pulls tokens directly from user
        uniswapRouter.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );
    }

   
}