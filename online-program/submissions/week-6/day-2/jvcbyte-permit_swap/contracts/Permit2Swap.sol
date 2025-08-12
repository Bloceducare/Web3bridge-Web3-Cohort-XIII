// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IUniswapV2Router02.sol";

interface IERC20WithAllowance is IERC20 {
    function allowance(address owner, address spender) external view returns (uint256);
}

contract PermitSwap is EIP712, ReentrancyGuard {

    error InvalidSwap();
    
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    IUniswapV2Router02 public immutable uniswapRouter;
    
    // EIP-712 type hash for swap permits
    bytes32 public constant SWAP_PERMIT_TYPEHASH = keccak256(
        "SwapPermit(address owner,address tokenIn,address tokenOut,uint256 amountIn,uint256 amountOutMin,uint256 deadline,uint256 nonce)"
    );
    
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
    
    event RelayedSwapExecuted(
        address indexed user,
        address indexed relayer,
        address indexed tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(address _uniswapRouter) EIP712("PermitSwap", "1") {
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
    }

    struct SwapParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOutMin;
        uint256 deadline;
    }

    struct PermitData {
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    /**
     * @notice Execute swap using ERC20 permit for approval
     * @param params Swap parameters
     * @param permitData Permit signature data
     */
    function swapWithPermit(
        SwapParams calldata params,
        PermitData calldata permitData
    ) external nonReentrant {
        require(block.timestamp <= params.deadline, "Swap expired");
        
        IERC20 token = IERC20(params.tokenIn);
        
        // For DAI, we'll use a different approach since its permit is non-standard
        if (params.tokenIn == 0x6B175474E89094C44Da98b954EedeAC495271d0F) {
            // First, try to use the existing allowance
            uint256 currentAllowance = token.allowance(msg.sender, address(this));
            
            // If current allowance is not enough, try to use the permit
            if (currentAllowance < params.amountIn) {
                try IERC20Permit(params.tokenIn).permit(
                    msg.sender,
                    address(this),
                    params.amountIn,
                    permitData.deadline,
                    permitData.v,
                    permitData.r,
                    permitData.s
                ) {
                    // If permit succeeds, update the current allowance
                    currentAllowance = token.allowance(msg.sender, address(this));
                } catch {
                    // If permit fails, check if we have enough allowance
                    currentAllowance = token.allowance(msg.sender, address(this));
                }
                
                // If we still don't have enough allowance, revert
                require(currentAllowance >= params.amountIn, "PermitSwap: INSUFFICIENT_ALLOWANCE");
            }
        } else {
            // For other tokens, use the standard permit flow
            try IERC20Permit(params.tokenIn).permit(
                msg.sender,
                address(this),
                params.amountIn,
                permitData.deadline,
                permitData.v,
                permitData.r,
                permitData.s
            ) {} catch {
                // If permit fails, check if we have enough allowance
                uint256 currentAllowance = token.allowance(msg.sender, address(this));
                require(currentAllowance >= params.amountIn, "PermitSwap: INSUFFICIENT_ALLOWANCE");
            }
        }
        
        // Execute the swap
        _executeSwap(msg.sender, params);
        
        emit SwapExecuted(
            msg.sender,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            0 // Will be filled by actual amount out
        );
    }

    /**
     * @notice Execute swap on behalf of user using meta-transaction
     * @param user The user who signed the permit
     * @param params Swap parameters  
     * @param signature EIP-712 signature for the swap permit
     * @param permitData ERC20 permit signature data
     */
    function relayedSwapWithPermit(
        address user,
        SwapParams calldata params,
        bytes calldata signature,
        PermitData calldata permitData
    ) external nonReentrant {
        require(block.timestamp <= params.deadline, "Swap expired");
        
        // Verify the swap permit signature
        bytes32 structHash = keccak256(abi.encode(
            SWAP_PERMIT_TYPEHASH,
            user,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            params.amountOutMin,
            params.deadline,
            nonces[user]
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(signer == user, "Invalid signature");
        
        // Increment nonce to prevent replay
        nonces[user]++;
        
        IERC20Permit token = IERC20Permit(params.tokenIn);
        
        // Use permit to approve tokens from user to this contract
        token.permit(
            user,
            address(this),
            params.amountIn,
            permitData.deadline,
            permitData.v,
            permitData.r,
            permitData.s
        );
        
        // Execute the swap
        _executeSwap(user, params);
        
        emit RelayedSwapExecuted(
            user,
            msg.sender,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            0 // Will be filled by actual amount out
        );
    }

    /**
     * @notice Internal function to execute the actual swap
     */
    function _executeSwap(address user, SwapParams calldata params) internal {
        IERC20 tokenIn = IERC20(params.tokenIn);
        
        // Transfer tokens from user to this contract
        tokenIn.safeTransferFrom(user, address(this), params.amountIn);
        
        // Approve Uniswap router to spend tokens
        tokenIn.forceApprove(address(uniswapRouter), params.amountIn);
        
        // Set up swap path
        address[] memory path = new address[](2);
        path[0] = params.tokenIn;
        path[1] = params.tokenOut;
        
        // Execute swap
        uint[] memory swapStatus = uniswapRouter.swapExactTokensForTokens(
            params.amountIn,
            params.amountOutMin,
            path,
            user, // Send output tokens directly to user
            params.deadline
        );

        if (swapStatus.length == 0) {
            revert InvalidSwap();
        }

        emit SwapExecuted(
            user,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            swapStatus[1] // Actual amount out
        );
    }

    /**
     * @notice Get expected output amount for a swap
     */
    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        uint256[] memory amounts = uniswapRouter.getAmountsOut(amountIn, path);
        return amounts[1];
    }

    /**
     * @notice Get domain separator for EIP-712
     */
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}