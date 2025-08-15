// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Uniswap V2 Router interface (simplified for this implementation)
interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function getAmountsOut(uint amountIn, address[] calldata path)
        external view returns (uint[] memory amounts);
}

/**
 * @title UniswapPermitSwap
 * @dev Contract that enables gasless token swaps using EIP-712 permit signatures
 *
 * This contract allows users to:
 * 1. Sign an off-chain permit for token approval using EIP-712
 * 2. Execute a Uniswap swap in a single transaction without prior on-chain approval
 *
 * The contract implements EIP-712 structured data signing for secure off-chain permits
 * and integrates with Uniswap V2 router for token swaps.
 */
contract UniswapPermitSwap is EIP712, ReentrancyGuard {
    using ECDSA for bytes32;

    // EIP-712 type hash for SwapWithPermit
    bytes32 public constant SWAP_WITH_PERMIT_TYPEHASH = keccak256(
        "SwapWithPermit(address owner,address tokenIn,address tokenOut,uint256 amountIn,uint256 amountOutMin,uint256 deadline,uint256 nonce)"
    );

    // Uniswap V2 Router address (this would be the actual router address on mainnet)
    IUniswapV2Router public immutable uniswapRouter;
    
    // Nonces for replay protection
    mapping(address => uint256) public nonces;

    // Events
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    event PermitUsed(
        address indexed owner,
        address indexed spender,
        uint256 value,
        uint256 deadline,
        uint256 nonce
    );

    /**
     * @dev Constructor
     * @param _uniswapRouter Address of the Uniswap V2 Router
     */
    constructor(address _uniswapRouter) EIP712("UniswapPermitSwap", "1") {
        require(_uniswapRouter != address(0), "Invalid router address");
        uniswapRouter = IUniswapV2Router(_uniswapRouter);
    }

    /**
     * @dev Execute a token swap using an off-chain permit signature
     * @param owner Address of the token owner
     * @param tokenIn Address of the input token
     * @param tokenOut Address of the output token
     * @param amountIn Amount of input tokens to swap
     * @param amountOutMin Minimum amount of output tokens expected
     * @param deadline Deadline for the swap transaction
     * @param permitDeadline Deadline for the permit signature
     * @param v Recovery byte of the permit signature
     * @param r First 32 bytes of the permit signature
     * @param s Second 32 bytes of the permit signature
     */
    function swapWithPermit(
        address owner,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline,
        uint256 permitDeadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant {
        require(block.timestamp <= deadline, "Swap deadline expired");
        require(owner != address(0), "Invalid owner address");
        require(tokenIn != address(0), "Invalid tokenIn address");
        require(tokenOut != address(0), "Invalid tokenOut address");
        require(amountIn > 0, "Amount must be greater than 0");

        // Use permit to approve tokens
        IERC20Permit(tokenIn).permit(
            owner,
            address(this),
            amountIn,
            permitDeadline,
            v,
            r,
            s
        );

        emit PermitUsed(owner, address(this), amountIn, permitDeadline, 0);

        // Transfer tokens from owner to this contract
        IERC20(tokenIn).transferFrom(owner, address(this), amountIn);

        // Approve Uniswap router to spend tokens
        IERC20(tokenIn).approve(address(uniswapRouter), amountIn);

        // Execute the swap
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            owner, // Send output tokens directly to owner
            deadline
        );

        emit SwapExecuted(owner, tokenIn, tokenOut, amountIn, amounts[1]);
    }

    /**
     * @dev Execute a token swap using a custom EIP-712 permit signature
     * This function demonstrates how to implement custom permit functionality
     * @param owner Address of the token owner
     * @param tokenIn Address of the input token
     * @param tokenOut Address of the output token
     * @param amountIn Amount of input tokens to swap
     * @param amountOutMin Minimum amount of output tokens expected
     * @param deadline Deadline for the swap transaction
     * @param v Recovery byte of the custom permit signature
     * @param r First 32 bytes of the custom permit signature
     * @param s Second 32 bytes of the custom permit signature
     */
    function swapWithCustomPermit(
        address owner,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant {
        require(block.timestamp <= deadline, "Swap deadline expired");
        require(owner != address(0), "Invalid owner address");
        require(tokenIn != address(0), "Invalid tokenIn address");
        require(tokenOut != address(0), "Invalid tokenOut address");
        require(amountIn > 0, "Amount must be greater than 0");

        // Verify the custom EIP-712 signature
        bytes32 structHash = keccak256(abi.encode(
            SWAP_WITH_PERMIT_TYPEHASH,
            owner,
            tokenIn,
            tokenOut,
            amountIn,
            amountOutMin,
            deadline,
            nonces[owner]
        ));

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, v, r, s);
        require(signer == owner, "Invalid signature");

        // Increment nonce to prevent replay attacks
        nonces[owner]++;

        // For this custom permit, we assume the owner has already approved
        // this contract to spend their tokens (this is just for demonstration)
        // In a real implementation, you might integrate with a different permit system

        // Transfer tokens from owner to this contract
        IERC20(tokenIn).transferFrom(owner, address(this), amountIn);

        // Approve Uniswap router to spend tokens
        IERC20(tokenIn).approve(address(uniswapRouter), amountIn);

        // Execute the swap
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            owner, // Send output tokens directly to owner
            deadline
        );

        emit SwapExecuted(owner, tokenIn, tokenOut, amountIn, amounts[1]);
    }

    /**
     * @dev Get the current nonce for an address
     * @param owner Address to get nonce for
     * @return Current nonce value
     */
    function getNonce(address owner) external view returns (uint256) {
        return nonces[owner];
    }

    /**
     * @dev Get the domain separator for EIP-712
     * @return Domain separator hash
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @dev Get the type hash for SwapWithPermit
     * @return Type hash
     */
    function getSwapWithPermitTypeHash() external pure returns (bytes32) {
        return SWAP_WITH_PERMIT_TYPEHASH;
    }
}
