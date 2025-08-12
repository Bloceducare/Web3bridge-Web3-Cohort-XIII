// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../src/IPermit.sol";
import "../src/IUniswapRouter.sol";
import "../src/IERC20.sol";

contract Swap {
    address public uniswapRouter;

    constructor(address _uniswapRouter) {
        uniswapRouter = _uniswapRouter;
    }

    struct Permit {
        address owner;
        uint256 value;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    function swapWithPermit(
        address tokenIn,uint256 amountIn,uint256 amountOutMin,address[] calldata path,
        address to,uint256 deadline,Permit calldata permit
    ) external {
        require(path[0] == tokenIn, "Path must start with recieving token");
        IERC20Permit(tokenIn).permit(permit.owner, address(this),permit.value,permit.deadline,permit.v,permit.r,permit.s);
        require(IERC20(tokenIn).transferFrom(permit.owner, address(this), amountIn),"transferFrom failed");
        require(IERC20(tokenIn).approve(uniswapRouter, amountIn),"approve failed");
        IUniswapRouter(uniswapRouter).swapExactTokensForTokens(amountIn,amountOutMin,path,to,deadline);
        IERC20(tokenIn).approve(uniswapRouter, 0);

    }
}
