// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../interfaces/IERC20Permit.sol";
import "../interfaces/ISignatureTransfer.sol";
import "../interfaces/ISwapRouter.sol";

contract swapPermit {

    address public constant SWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    
    address public constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    
    uint24 public constant POOL_FEE = 3000;


    error FailedSignature();
    error InsufficientFund();
    error SwapFailed();
    error DeadlineExpired();


    event SwapDone(
        address indexed user,
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        uint256 amountOut
    );

    
    struct SwapWitness {
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountOutMinimum;
    }

    
    bytes32 public constant SWAP_WITNESS_TYPEHASH =
        keccak256("SwapWitness(address tokenOut,uint24 fee,address recipient,uint256 amountOutMinimum)");

    
    string public constant WITNESS_TYPE_STRING =
        "SwapWitness witness)SwapWitness(address tokenOut,uint24 fee,address recipient,uint256 amountOutMinimum)TokenPermissions(address token,uint256 amount)";

    
    function swapWithPermit(
        address owner,
        ISignatureTransfer.PermitTransferFrom memory permit,
        address recipient,
        uint256 amountOutMinimum,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (uint256 amountOut) {
        
        if (block.timestamp > deadline) {
            revert DeadlineExpired();
        }

        
        if (permit.permitted.amount == 0) {
            revert InsufficientFund();
        }

        
        SwapWitness memory witnessData = SwapWitness({
            tokenOut: recipient == address(this) ? permit.permitted.token : recipient,
            fee: POOL_FEE,
            recipient: recipient,
            amountOutMinimum: amountOutMinimum
        });
        bytes32 witness = keccak256(abi.encode(SWAP_WITNESS_TYPEHASH, witnessData));

    
        try
            ISignatureTransfer(PERMIT2).permitWitnessTransferFrom(
                permit,
                ISignatureTransfer.SignatureTransferDetails({
                    to: address(this),
                    requestedAmount: permit.permitted.amount
                }),
                owner,
                witness,
                WITNESS_TYPE_STRING,
                bytes(abi.encodePacked(r, s, v))
            )
        {
        } catch {
            revert FailedSignature();
        }


        if (!IERC20Permit(permit.permitted.token).approve(SWAP_ROUTER, permit.permitted.amount)) {
            revert SwapFailed();
        }


        try
            ISwapRouter(SWAP_ROUTER).exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: permit.permitted.token,
                    tokenOut: witnessData.tokenOut,
                    fee: POOL_FEE,
                    recipient: recipient,
                    deadline: deadline,
                    amountIn: permit.permitted.amount,
                    amountOutMinimum: amountOutMinimum,
                    sqrtPriceLimitX96: 0
                })
            )
        returns (uint256 _amountOut) {
            amountOut = _amountOut;
            emit SwapDone(
                owner,
                permit.permitted.token,
                permit.permitted.amount,
                witnessData.tokenOut,
                amountOut
            );
        } catch {
            revert SwapFailed();
        }

        return amountOut;
    }
}