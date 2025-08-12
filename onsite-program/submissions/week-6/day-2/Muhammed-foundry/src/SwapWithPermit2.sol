// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "forge-std/interfaces/IERC20.sol";

interface IPermit2 {
    struct PermitTransferFrom {
        address token;
        uint256 amount;
    }
    
    struct SignatureTransferDetails {
        address to;
        uint256 requestedAmount;
    }
    
    function permitTransferFrom(
        PermitTransferFrom memory permit,
        SignatureTransferDetails memory transferDetails,
        address owner,
        bytes calldata signature
    ) external;
}

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function getAmountsOut(uint amountIn, address[] calldata path)
        external view returns (uint[] memory amounts);
}

contract SwapWithPermit2 {
    
    IUniswapV2Router public constant UNISWAP_ROUTER = 
        IUniswapV2Router(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    

    IPermit2 public constant PERMIT2 = 
        IPermit2(0x000000000022D473030F116dDEE9F6B43aC78BA3);
    

    address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;

    struct SwapParams {
        address tokenIn;
        uint256 amountIn;
        uint256 amountOutMin;
        uint256 deadline;
    }

    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        uint256 amountIn,
        uint256 amountOut
    );

    
    function swapWithPermit2(
        SwapParams calldata params,
        address owner,
        bytes calldata signature
    ) external {
        require(block.timestamp <= params.deadline, "Swap expired");
        
 
        IPermit2.PermitTransferFrom memory permit = IPermit2.PermitTransferFrom({
            token: params.tokenIn,
            amount: params.amountIn
        });
        
        IPermit2.SignatureTransferDetails memory transferDetails = 
            IPermit2.SignatureTransferDetails({
                to: address(this),
                requestedAmount: params.amountIn
            });
        
  
        PERMIT2.permitTransferFrom(
            permit,
            transferDetails,
            owner,
            signature
        );
        

        IERC20(params.tokenIn).approve(address(UNISWAP_ROUTER), params.amountIn);
        

        address[] memory path = new address[](2);
        path[0] = params.tokenIn;
        path[1] = DAI;
        

        uint[] memory amounts = UNISWAP_ROUTER.swapExactTokensForTokens(
            params.amountIn,
            params.amountOutMin,
            path,
            owner,
            params.deadline
        );
        
        emit SwapExecuted(owner, params.tokenIn, params.amountIn, amounts[1]);
    }
    
   
    function getExpectedOutput(address tokenIn, uint256 amountIn) 
        external view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = DAI;
        
        uint[] memory amounts = UNISWAP_ROUTER.getAmountsOut(amountIn, path);
        return amounts[1];
    }
}