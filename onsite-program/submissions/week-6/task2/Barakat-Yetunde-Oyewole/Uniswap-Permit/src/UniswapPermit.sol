// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./iUniswapPermit.sol";

contract UniswapPermit is ReentrancyGuard {
    
    // Events
    event PermitSwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 deadline
    );
    
    event SwapWithPermitFailed(
        address indexed user,
        address indexed tokenIn,
        string reason
    );
    
    // State variables
    IUniswapV2Router02 public immutable uniswapRouter;
    address public immutable WETH;
    
    // Custom errors
    error InvalidDeadline();
    error InvalidAmount();
    error InvalidAddress();
    error SwapFailed();
    error PermitFailed();
    error InsufficientOutput();
    
    constructor(address _uniswapRouter) {
        if (_uniswapRouter == address(0)) revert InvalidAddress();
        
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        WETH = IUniswapV2Router02(_uniswapRouter).WETH();
    }
    
    
    function permitAndSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant {
        // Input validation
        if (deadline < block.timestamp) revert InvalidDeadline();
        if (amountIn == 0) revert InvalidAmount();
        if (tokenIn == address(0) || tokenOut == address(0)) revert InvalidAddress();
        
        // Execute permit to approve tokens
        try IERC20Permit(tokenIn).permit(
            msg.sender,
            address(this),
            amountIn,
            deadline,
            v,
            r,
            s
        ) {
            // Permit successful, proceed with swap
        } catch {
            revert PermitFailed();
        }
        
        // Transfer tokens from user to this contract
        bool transferSuccess = IERC20(tokenIn).transferFrom(
            msg.sender,
            address(this),
            amountIn
        );
        if (!transferSuccess) revert SwapFailed();
        
        // Approve Uniswap router to spend tokens
        bool approveSuccess = IERC20(tokenIn).approve(address(uniswapRouter), amountIn);
        if (!approveSuccess) revert SwapFailed();
        
        // Create swap path
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        uint256[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            msg.sender,
            deadline
        );
        
        if (amounts[1] < amountOutMin) revert InsufficientOutput();
        
        emit PermitSwapExecuted(
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            amounts[1],
            deadline
        );
    }
    

    struct SwapParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOutMin;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }
    
    function batchPermitAndSwap(SwapParams[] calldata swaps) external nonReentrant {
        for (uint256 i = 0; i < swaps.length; i++) {
            SwapParams calldata swap = swaps[i];
            
            try this.permitAndSwap(
                swap.tokenIn,
                swap.tokenOut,
                swap.amountIn,
                swap.amountOutMin,
                swap.deadline,
                swap.v,
                swap.r,
                swap.s
            ) {
                // Swap successful
            } catch Error(string memory reason) {
                emit SwapWithPermitFailed(msg.sender, swap.tokenIn, reason);
            }
        }
    }
    
    
    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        if (amountIn == 0) return 0;
        
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        uint256[] memory amounts = uniswapRouter.getAmountsOut(amountIn, path);
        return amounts[1];
    }
    
    
    function getSwapPath(
        address tokenA,
        address tokenB
    ) external view returns (address[] memory path) {
        if (tokenA == WETH || tokenB == WETH) {
            path = new address[](2);
            path[0] = tokenA;
            path[1] = tokenB;
        } else {
            path = new address[](3);
            path[0] = tokenA;
            path[1] = WETH;
            path[2] = tokenB;
        }
        
        return path;
    }
    
   
    function permitAndSwapWithPath(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant {
        // Validate inputs
        if (deadline < block.timestamp) revert InvalidDeadline();
        if (amountIn == 0) revert InvalidAmount();
        if (path.length < 2) revert InvalidAddress();
        if (path[0] != tokenIn || path[path.length - 1] != tokenOut) revert InvalidAddress();
        
        // Execute permit
        try IERC20Permit(tokenIn).permit(
            msg.sender,
            address(this),
            amountIn,
            deadline,
            v,
            r,
            s
        ) {} catch {
            revert PermitFailed();
        }
        
        // Transfer tokens to contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        // Approve router
        IERC20(tokenIn).approve(address(uniswapRouter), amountIn);
        
        // Execute swap with custom path
        uint256[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            msg.sender,
            deadline
        );
        
        emit PermitSwapExecuted(
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            amounts[amounts.length - 1],
            deadline
        );
    }
    
    
    function recoverToken(
        address token,
        uint256 amount,
        address to
    ) external {
        // In production, add access control here
        IERC20(token).transfer(to, amount);
    }
    
    
    function supportsPermit(address token) external view returns (bool supported) {
        try IERC20Permit(token).DOMAIN_SEPARATOR() {
            return true;
        } catch {
            return false;
        }
    }
}


