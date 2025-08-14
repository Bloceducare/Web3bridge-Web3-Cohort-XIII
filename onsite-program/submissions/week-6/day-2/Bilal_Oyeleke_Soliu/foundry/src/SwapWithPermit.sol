// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "../lib/forge-std/src/interfaces/IERC20.sol";
import {IUniswapV2Router02} from "./interfaces/IUniswapV2Router.sol";
import {IERC20Permit} from "./interfaces/IERC20Permit.sol";

contract SwapWithPermit {
    IUniswapV2Router02 public immutable uniswapRouter;
    
    struct SwapParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOutMin;
        address to;
        uint256 deadline;
    }
    
    struct PermitParams {
        uint256 value;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }
    
    constructor(address _uniswapRouter) {
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
    }
    
    function swapWithPermit(
        SwapParams calldata swapParams,
        PermitParams calldata permitParams
    ) external {
        IERC20Permit(swapParams.tokenIn).permit(
            msg.sender,
            address(this),
            permitParams.value,
            permitParams.deadline,
            permitParams.v,
            permitParams.r,
            permitParams.s
        );
        
        IERC20(swapParams.tokenIn).transferFrom(
            msg.sender,
            address(this),
            swapParams.amountIn
        );
        
        IERC20(swapParams.tokenIn).approve(
            address(uniswapRouter),
            swapParams.amountIn
        );
        
        address[] memory path = new address[](2);
        path[0] = swapParams.tokenIn;
        path[1] = swapParams.tokenOut;
        
        uniswapRouter.swapExactTokensForTokens(
            swapParams.amountIn,
            swapParams.amountOutMin,
            path,
            swapParams.to,
            swapParams.deadline
        );
    }
}