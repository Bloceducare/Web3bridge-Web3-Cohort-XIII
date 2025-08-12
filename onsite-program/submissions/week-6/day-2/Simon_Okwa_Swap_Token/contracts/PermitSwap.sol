// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IERC20Permit.sol";
import "./interfaces/IUniswapRouter.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


contract PermitSwap is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;


    IUniswapRouter public uniswapRouter;

    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    event PermitApplied(
        address indexed owner,
        address indexed spender,
        uint256 value,
        uint256 deadline
    );

    event RouterUpdated(address indexed oldRouter, address indexed newRouter);

    constructor(address _uniswapRouter) Ownable(msg.sender) {
        require(_uniswapRouter != address(0), "Invalid router address");
        uniswapRouter = IUniswapRouter(_uniswapRouter);
    }

    function permitAndSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMinimum,
        uint24 fee,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant returns (uint256 amountOut) {
        require(block.timestamp <= deadline, "Permit expired");
        require(tokenIn != address(0) && tokenOut != address(0), "Invalid token addresses");
        require(amountIn > 0, "Invalid amount");

      
        IERC20Permit(tokenIn).permit(
            msg.sender,
            address(this),
            amountIn,
            deadline,
            v,
            r,
            s
        );

        emit PermitApplied(msg.sender, address(this), amountIn, deadline);

     
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);


IERC20(tokenIn).approve(address(uniswapRouter), 0);
IERC20(tokenIn).approve(address(uniswapRouter), amountIn);


      
        IUniswapRouter.ExactInputSingleParams memory params = IUniswapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: msg.sender,
            deadline: deadline,
            amountIn: amountIn,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: 0
        });

        amountOut = uniswapRouter.exactInputSingle(params);

        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut);

      
        IERC20(tokenIn).approve(address(uniswapRouter), 0);
    }

    function permitAndSwapWithPath(
        bytes calldata path,
        uint256 amountIn,
        uint256 amountOutMinimum,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant returns (uint256 amountOut) {
        require(block.timestamp <= deadline, "Permit expired");
        require(path.length >= 40, "Invalid path length"); 
        require(amountIn > 0, "Invalid amount");

        address tokenIn = _toAddress(path, 0);
        address tokenOut = _toAddress(path, path.length - 20);

       
        IERC20Permit(tokenIn).permit(
            msg.sender,
            address(this),
            amountIn,
            deadline,
            v,
            r,
            s
        );

        emit PermitApplied(msg.sender, address(this), amountIn, deadline);

        
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

       
    IERC20(tokenIn).approve(address(uniswapRouter), 0);
IERC20(tokenIn).approve(address(uniswapRouter), amountIn);

        IUniswapRouter.ExactInputParams memory params = IUniswapRouter.ExactInputParams({
            path: path,
            recipient: msg.sender,
            deadline: deadline,
            amountIn: amountIn,
            amountOutMinimum: amountOutMinimum
        });

        amountOut = uniswapRouter.exactInput(params);

        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut);

       
         IERC20(tokenIn).approve(address(uniswapRouter), 0);
    }

    function updateRouter(address newRouter) external onlyOwner {
        require(newRouter != address(0), "Invalid router address");
        address old = address(uniswapRouter);
        uniswapRouter = IUniswapRouter(newRouter);
        emit RouterUpdated(old, newRouter);
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            (bool ok, ) = owner().call{value: amount}("");
            require(ok, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    function _toAddress(bytes memory _bs, uint256 _start) internal pure returns (address addr) {
        require(_bs.length >= _start + 20, "toAddress_outOfBounds");
        assembly {
            addr := div(mload(add(add(_bs, 0x20), _start)), 0x1000000000000000000000000)
        }
    }

    receive() external payable {}
    fallback() external payable {}
}
