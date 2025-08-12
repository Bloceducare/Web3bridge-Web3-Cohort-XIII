// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

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

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
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

contract PermitSwapHelper is ReentrancyGuard {
    event PermitAndSwapExecuted(address indexed owner, address token, uint256 amountIn, address[] path);

    function permitAndSwap(
        address owner,
        address token,
        address router,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "Deadline expired");

        // Approve this contract to spend token via EIP-712 permit
        IERC20Permit(token).permit(owner, address(this), amountIn, deadline, v, r, s);

        // Transfer tokens to this contract
        require(IERC20Permit(token).transferFrom(owner, address(this), amountIn), "TransferFrom failed");

        // Approve Uniswap router to spend token
        require(IERC20Permit(token).approve(router, amountIn), "Approve failed");

        // Execute swap
        amounts = IUniswapV2Router02(router).swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );

        emit PermitAndSwapExecuted(owner, token, amountIn, path);
        return amounts;
    }
}