// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {IUniswapV2Router02} from "v2-periphery/interfaces/IUniswapV2Router02.sol";

contract OffChainSigning {
  //Create a variable for the router address
  address immutable IROUTER;

  //Initialize the variable from the constructor
  constructor(address _IROUTER) {
    IROUTER = _IROUTER;

  }

  struct Permit {
    address owner;
    uint256 value;
    uint256 deadline;
    uint8 v;
    bytes32 r;
    bytes32 s;
  }

  function swapWithPermit (
    address tokenIn,
    uint256 amountIn,
    uint256 amountOutMin,
    address [] calldata path,
    address to,
    uint256 deadline,
    Permit calldata permit
  ) external {
    require(path[0] == tokenIn, "TokenIn must be the first token");
    IERC20Permit(tokenIn).permit(
      permit.owner,
      address(this),
      permit.value,
      permit.deadline,
      permit.v,
      permit.r,
      permit.s
    );

    IERC20(tokenIn).transferFrom(permit.owner, address(this), amountIn);
    IUniswapV2Router02(IROUTER).swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      to,
      deadline
    );
  }
     
}
