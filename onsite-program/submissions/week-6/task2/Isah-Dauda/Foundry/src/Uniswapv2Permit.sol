// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IERC20Permit {
    function balanceOf(address account) external view returns (uint);
    function transfer(address to, uint amount) external returns (bool);
    function nonces(address owner) external view returns (uint256);
    function permit(address owner,address spender,uint value,uint deadline, uint8 v,bytes32 r, bytes32 s) external;
    function transferFrom(address from, address to, uint amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IUniswapV2Router {
    function swapExactTokensForTokens( uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts);
}

contract UniswapV2SwapWithPermit {
    address public constant UNIv2Router =
        0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

    function swapWithPermit( address token, uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline, uint permitDeadline, uint8 v, bytes32 r, bytes32 s) external {
        if (token == address(0)) revert("Invalid Token Address");
        if (to == address(0)) revert("Invalid recipient Address");
        if (amountIn == 0) revert("AmountIn must be greater than 0");
        if (path.length < 2) revert("Swap path is too short");
        if (path[0] != token) revert("Path does not start with token");
        if (block.timestamp > deadline) revert("Transaction expired");
        if (block.timestamp > permitDeadline) revert("Permit expired");

        // Use permit to approve this contract to spend tokens
        IERC20Permit(token).permit(msg.sender, address(this), amountIn, permitDeadline, v, r, s);

        // Pull tokens from user to this contract
        bool success = IERC20Permit(token).transferFrom(msg.sender, address(this), amountIn);
        if (!success) revert("Token transfer failed");

        // Approve Uniswap Router to spend tokens
        bool approveSuccess = IERC20Permit(token).approve(UNIv2Router, amountIn
        );
        if (!approveSuccess) revert("Token approval failed");

        // Perform the swap
        IUniswapV2Router(UNIv2Router).swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline
        );
    }
}
