// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Interface definitions to avoid dependency issues
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IERC20Permit {
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
    
    function nonces(address owner) external view returns (uint256);
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}

// Safe transfer library to avoid external dependency
library TransferHelper {
    function safeTransfer(address token, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, value)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TH: TRANSFER_FAILED');
    }

    function safeTransferFrom(address token, address from, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, value)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TH: TRANSFER_FROM_FAILED');
    }

    function safeApprove(address token, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.approve.selector, to, value)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TH: APPROVE_FAILED');
    }
}

/**
 * @title PermitSwap
 * @dev Contract that enables gasless token approvals using EIP-712 signatures
 * and executes Uniswap V3 swaps in a single transaction
 */
contract PermitSwap {
    using TransferHelper for address;
    
    ISwapRouter public immutable swapRouter;
    
    event SwapWithPermit(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    constructor(address _swapRouter) {
        swapRouter = ISwapRouter(_swapRouter);
    }
    
    /**
     * @dev Execute a token swap using EIP-712 permit for approval
     */
    function swapWithPermit(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint256 amountOutMinimum,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (uint256 amountOut) {
        // Use permit to approve tokens without prior approval transaction
        IERC20Permit(tokenIn).permit(
            msg.sender,
            address(this),
            amountIn,
            deadline,
            v,
            r,
            s
        );
        
        // Transfer tokens from user to this contract
        tokenIn.safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Approve the router to spend our tokens
        tokenIn.safeApprove(address(swapRouter), amountIn);
        
        // Execute the swap
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: fee,
                recipient: msg.sender,
                deadline: deadline,
                amountIn: amountIn,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0
            });
            
        amountOut = swapRouter.exactInputSingle(params);
        
        emit SwapWithPermit(
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            amountOut
        );
    }
    
    /**
     * @dev Execute swap on behalf of user (relayer functionality)
     */
    function swapWithPermitOnBehalf(
        address user,
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint256 amountOutMinimum,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (uint256 amountOut) {
        // Use permit to approve tokens on behalf of user
        IERC20Permit(tokenIn).permit(
            user,
            address(this),
            amountIn,
            deadline,
            v,
            r,
            s
        );
        
        // Transfer tokens from user to this contract
        tokenIn.safeTransferFrom(user, address(this), amountIn);
        
        // Approve the router to spend our tokens
        tokenIn.safeApprove(address(swapRouter), amountIn);
        
        // Execute the swap (tokens go back to original user)
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: fee,
                recipient: user,
                deadline: deadline,
                amountIn: amountIn,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0
            });
            
        amountOut = swapRouter.exactInputSingle(params);
        
        emit SwapWithPermit(user, tokenIn, tokenOut, amountIn, amountOut);
    }
}