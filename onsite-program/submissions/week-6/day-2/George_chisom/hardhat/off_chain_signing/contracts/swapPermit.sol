// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "../interfaces/ISwapRouter.sol";
import "./EIP712Helper.sol";


contract SwapPermit {
    EIP712Helper public eip712Helper;

    address public constant UNISWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    

    error DeadlineExpired();
    error InsufficientAmount();
    error SwapFailed();
    error InvalidSignature();
    
    
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    
    function swapWithPermit(
        address owner,
        address tokenIn,
        uint256 permitAmount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 swapAmountIn,
        uint256 swapAmountOutMin,
        address tokenOut,
        address recipient,
        uint256 swapDeadline,
        uint24 fee
    ) external returns (uint256 amountOut) {
            
            if (block.timestamp > deadline) {
                revert DeadlineExpired();
            }
            
            
            if (swapAmountIn > permitAmount) {
                revert InsufficientAmount();
            }
            
            IERC20Permit token = IERC20Permit(tokenIn);
            
            
            try token.permit(owner, address(this), permitAmount, deadline, v, r, s) {
            } catch {
                revert InvalidSignature();
            }
            
            
            IERC20(tokenIn).transferFrom(owner, address(this), swapAmountIn);
            
            
            IERC20(tokenIn).approve(UNISWAP_ROUTER, swapAmountIn);
            
            
            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: fee,
                recipient: recipient,
                deadline: swapDeadline,
                amountIn: swapAmountIn,
                amountOutMinimum: swapAmountOutMin,
                sqrtPriceLimitX96: 0 
            });
            
            
            amountOut = ISwapRouter(UNISWAP_ROUTER).exactInputSingle(params);
            
            
            emit SwapExecuted(owner, tokenIn, tokenOut, swapAmountIn, amountOut);
            
            return amountOut;
    }
        
    function swapDAIToUSDC(
            address owner,
            uint256 amountIn,
            uint256 deadline,
            uint8 v,
            bytes32 r,
            bytes32 s,
            address recipient
    ) external returns (uint256 amountOut) {
            address DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
            address USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
            uint24 fee = 3000; 
            
            return this.swapWithPermit(
                owner,
                DAI,
                amountIn,
                deadline,
                v,
                r,
                s,
                amountIn,
                0, 
                USDC,
                recipient,
                deadline,
                fee
            );
    }
}