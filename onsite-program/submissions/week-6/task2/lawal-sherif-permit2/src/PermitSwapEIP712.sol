// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./interfaces/IERC20.sol";

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
}

interface IUniswapRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

contract PermitSwapEIP712 {
    IUniswapRouter public immutable router;
    
    bytes32 public immutable DOMAIN_SEPARATOR;
    
    bytes32 public constant SWAP_TYPEHASH = keccak256(
        "Swap(address tokenIn,address tokenOut,uint256 amountIn,uint256 amountOutMin,address to,uint256 deadline,uint256 nonce)"
    );
    
    mapping(address => uint256) public nonces;
    
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    constructor(address _router) {
        router = IUniswapRouter(_router);
        
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("PermitSwapEIP712")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }
    
    function permitAndSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address to,
        uint256 deadline,
        uint8 permitV,
        bytes32 permitR,
        bytes32 permitS,
        uint8 swapV,
        bytes32 swapR,
        bytes32 swapS
    ) external {
        _verifySwapSignature(tokenIn, tokenOut, amountIn, amountOutMin, to, deadline, swapV, swapR, swapS);
        
        IERC20Permit(tokenIn).permit(to, address(this), amountIn, deadline, permitV, permitR, permitS);
        
        _executeSwap(tokenIn, tokenOut, amountIn, amountOutMin, to, deadline);
    }
    
    function permitAndSwapSimple(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        IERC20Permit(tokenIn).permit(
            msg.sender,
            address(this),
            amountIn,
            deadline,
            v,
            r,
            s
        );
        
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        IERC20(tokenIn).approve(address(router), amountIn);
        
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            msg.sender,
            deadline
        );
    }
    
    function getSwapHash(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address to,
        uint256 deadline,
        uint256 nonce
    ) external view returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        SWAP_TYPEHASH,
                        tokenIn,
                        tokenOut,
                        amountIn,
                        amountOutMin,
                        to,
                        deadline,
                        nonce
                    )
                )
            )
        );
    }
    
    function _verifySwapSignature(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address to,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal {
        require(deadline >= block.timestamp, "Swap deadline expired");
        
        bytes32 structHash = keccak256(
            abi.encode(
                SWAP_TYPEHASH,
                tokenIn,
                tokenOut,
                amountIn,
                amountOutMin,
                to,
                deadline,
                nonces[to]++
            )
        );
        
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        address signer = ecrecover(hash, v, r, s);
        require(signer == to, "Invalid swap signature");
    }
    
    function _executeSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address to,
        uint256 deadline
    ) internal {
        IERC20(tokenIn).transferFrom(to, address(this), amountIn);
        
        IERC20(tokenIn).approve(address(router), amountIn);
        
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        uint[] memory amounts = router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );
        
        emit SwapExecuted(to, tokenIn, tokenOut, amountIn, amounts[1]);
    }
}