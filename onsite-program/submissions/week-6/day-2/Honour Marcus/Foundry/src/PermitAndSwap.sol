// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/permit2/src/interfaces/IPermit2.sol"; 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract Permit2Base {
    IPermit2 public immutable permit2;

    constructor(address _permit2) {
        permit2 = IPermit2(_permit2);
    }
}

contract PermitAndSwap is Permit2Base {
    IUniswapV2Router02 public immutable uniswapRouter;

    constructor(address _permit2, address _uniswapRouter) Permit2Base(_permit2) {
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
    }

    function permit2Swap(
        IPermit2.PermitTransferFrom memory permit,
        IPermit2.SignatureTransferDetails memory transferDetails,
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
