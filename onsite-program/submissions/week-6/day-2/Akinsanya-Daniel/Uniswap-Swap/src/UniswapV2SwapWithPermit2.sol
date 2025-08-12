// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;
import "./IPermit2.sol";


// import "IUniswapV2Router.sol";
contract UniswapV2SwapWithPermit2 {
address public immutable PERMIT2;
    address public immutable UNISWAP_ROUTER;

    constructor(address _permit2, address _uniswapRouter) {
        PERMIT2 = _permit2;
        UNISWAP_ROUTER = _uniswapRouter;
    }

    function swapWithPermit2(
        IPermit2.PermitSingle calldata permitSingle,
        address owner,
        bytes calldata signature,
        uint amountOutMin,
        address[] calldata path,
        uint deadline
    ) external {
        require(path.length >= 2, "bad path");
        require(path[0] == permitSingle.token, "path must start with token");
        require(block.timestamp <= deadline, "swap deadline passed");
        require(block.timestamp <= permitSingle.sigDeadline, "permit signature expired");

        IPermit2(PERMIT2).permit(owner, permitSingle, signature);

        IPermit2(PERMIT2).transferFrom(owner, address(this), permitSingle.amount, permitSingle.token);

        IERC20(permitSingle.token).approve(UNISWAP_ROUTER, uint256(permitSingle.amount));


        IUniswapV2Router(UNISWAP_ROUTER).swapExactTokensForTokens(
            uint256(permitSingle.amount),
            amountOutMin,
            path,
            owner,
            deadline
        );
    }
}