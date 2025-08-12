// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IUniswapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockUniswapRouter is IUniswapRouter {
    function exactInputSingle(ExactInputSingleParams calldata params) external payable override returns (uint256 amountOut) {
       
        IERC20(params.tokenIn).transferFrom(msg.sender, params.recipient, params.amountIn);
        return params.amountIn; 
    }

    function exactInput(ExactInputParams calldata params) external payable override returns (uint256 amountOut) {
      
        address tokenIn = _toAddress(params.path, 0);
        IERC20(tokenIn).transferFrom(msg.sender, params.recipient, params.amountIn);
        return params.amountIn; 
    }


    function _toAddress(bytes memory _bs, uint256 _start) internal pure returns (address addr) {
        require(_bs.length >= _start + 20, "toAddress_outOfBounds");
        assembly {
            addr := div(mload(add(add(_bs, 0x20), _start)), 0x1000000000000000000000000)
        }
    }
}