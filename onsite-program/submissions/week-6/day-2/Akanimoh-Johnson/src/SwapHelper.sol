// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPermit2 {
    
    struct TokenPermissions {
        address token;
        uint256 amount;
    }

    struct PermitTransferFrom {
        TokenPermissions permitted;
        uint256 nonce;
        uint256 deadline;
    }

    struct SignatureTransferDetails {
        address to;
        uint256 requestedAmount;
    }

    function permitTransferFrom(
        PermitTransferFrom calldata permit,
        SignatureTransferDetails calldata transferDetails,
        address owner,
        bytes calldata signature
    ) external;
}

interface IUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

contract SwapHelper {
    address public immutable permit2;
    address public immutable uniswapV2Router;

    // Permit2: 0x000000000022D473030F116dDEE9F6B43aC78BA3
    // Uniswap V2 Router: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
    constructor(address _permit2, address _uniswapV2Router) {
        permit2 = _permit2;
        uniswapV2Router = _uniswapV2Router;
    }

    function permitAndSwap(
        address owner,
        IPermit2.PermitTransferFrom memory permit,
        uint256 amountIn,
        uint256 minAmountOut,
        address[] calldata path,
        address recipient,
        uint256 deadline,
        bytes calldata signature
    ) external {
        IPermit2.SignatureTransferDetails memory transferDetails = IPermit2.SignatureTransferDetails({
            to: address(this),
            requestedAmount: amountIn
        });

        IPermit2(permit2).permitTransferFrom(permit, transferDetails, owner, signature);

        address tokenIn = permit.permitted.token;
        IERC20(tokenIn).approve(uniswapV2Router, amountIn);

        IUniswapV2Router02(uniswapV2Router).swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            recipient,
            deadline
        );
    }
}