// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/IERC20.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IPermit2.sol";

/// @notice Minimal ECDSA library for signature recovery
library ECDSA {
    function recover(bytes32 hash, bytes memory signature) internal pure returns (address) {
        require(signature.length == 65, "ECDSA: invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }
        
        if (v < 27) {
            v += 27;
        }
        
        require(v == 27 || v == 28, "ECDSA: invalid v");
        
        address signer = ecrecover(hash, v, r, s);
        require(signer != address(0), "ECDSA: invalid signature");
        
        return signer;
    }
}

/// @notice EIP-712 base contract for domain separator and typed data hashing
abstract contract EIP712Base {
    bytes32 private immutable _CACHED_DOMAIN_SEPARATOR;
    uint256 private immutable _CACHED_CHAIN_ID;
    address private immutable _CACHED_THIS;

    bytes32 private immutable _HASHED_NAME;
    bytes32 private immutable _HASHED_VERSION;
    bytes32 private immutable _TYPE_HASH;

    constructor(string memory name, string memory version) {
        _HASHED_NAME = keccak256(bytes(name));
        _HASHED_VERSION = keccak256(bytes(version));
        _TYPE_HASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
        _CACHED_CHAIN_ID = block.chainid;
        _CACHED_THIS = address(this);
        _CACHED_DOMAIN_SEPARATOR = _buildDomainSeparator(_TYPE_HASH, _HASHED_NAME, _HASHED_VERSION);
    }

    function _buildDomainSeparator(bytes32 typeHash, bytes32 nameHash, bytes32 versionHash) private view returns (bytes32) {
        return keccak256(abi.encode(typeHash, nameHash, versionHash, block.chainid, address(this)));
    }

    function _domainSeparatorV4() internal view returns (bytes32) {
        if (block.chainid == _CACHED_CHAIN_ID && address(this) == _CACHED_THIS) {
            return _CACHED_DOMAIN_SEPARATOR;
        } else {
            return _buildDomainSeparator(_TYPE_HASH, _HASHED_NAME, _HASHED_VERSION);
        }
    }

    function _hashTypedDataV4(bytes32 structHash) internal view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", _domainSeparatorV4(), structHash));
    }
}

/// @notice Main contract for EIP-712 signed Uniswap swaps
contract PermitSwapEIP712 is EIP712Base {
    using ECDSA for bytes32;

    // EIP-712 typehash for the swap authorization
    bytes32 public constant SWAP_REQUEST_TYPEHASH = keccak256(
        "SwapRequest(address owner,address token,uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline,uint256 nonce)"
    );

    IUniswapV2Router02 public immutable router;
    IPermit2 public immutable permit2;

    // Nonce tracking to prevent replay attacks
    mapping(address => uint256) public nonces;

    event SwapExecuted(
        address indexed owner,
        address indexed token,
        uint256 amountIn,
        uint256 amountOutMin,
        address to,
        uint256 nonce
    );

    constructor(address _router, address _permit2) EIP712Base("PermitSwapEIP712", "1") {
        require(_router != address(0), "Invalid router address");
        router = IUniswapV2Router02(_router);
        permit2 = IPermit2(_permit2); // Can be zero if not using Permit2
    }

    /// @notice Get the current nonce for an owner
    function getNonce(address owner) external view returns (uint256) {
        return nonces[owner];
    }

    /// @notice Builds the EIP-712 digest for a SwapRequest
    function getSwapRequestHash(
        address owner,
        address token,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline,
        uint256 nonce
    ) public view returns (bytes32) {
        // Hash the dynamic array according to EIP-712 standard
        bytes32 pathHash = keccak256(abi.encodePacked(path));

        bytes32 structHash = keccak256(
            abi.encode(
                SWAP_REQUEST_TYPEHASH,
                owner,
                token,
                amountIn,
                amountOutMin,
                pathHash,
                to,
                deadline,
                nonce
            )
        );
        
        return _hashTypedDataV4(structHash);
    }

    /// @notice Execute a swap with traditional ERC20 approval + signature verification
    /// @dev Requires owner to have previously approved this contract for amountIn tokens
    function executeSignedSwap(
        address owner,
        address token,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline,
        uint256 nonce,
        bytes calldata signature
    ) external {
        require(block.timestamp <= deadline, "Deadline exceeded");
        require(path.length >= 2, "Invalid path");
        require(path[0] == token, "Path must start with input token");

        // Verify signature and nonce in a separate scope to avoid stack too deep
        {
            bytes32 digest = getSwapRequestHash(owner, token, amountIn, amountOutMin, path, to, deadline, nonce);
            address signer = ECDSA.recover(digest, signature);
            require(signer == owner, "Invalid signature");
            require(nonce == nonces[owner], "Invalid nonce");
            nonces[owner]++;
        }

        // Execute token transfer and swap
        require(IERC20(token).transferFrom(owner, address(this), amountIn), "Transfer failed");
        require(IERC20(token).approve(address(router), amountIn), "Approval failed");
        router.swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline);

        emit SwapExecuted(owner, token, amountIn, amountOutMin, to, nonce);
    }

    /// @notice Execute a swap using Permit2 for gasless token approval
    function executeSignedSwapWithPermit2(
        address owner,
        address token,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline,
        uint256 nonce,
        bytes calldata signature,
        IPermit2.PermitTransferFrom calldata permit,
        bytes calldata permitSignature
    ) external {
        require(address(permit2) != address(0), "Permit2 not configured");
        require(block.timestamp <= deadline, "Deadline exceeded");
        require(path.length >= 2, "Invalid path");
        require(path[0] == token, "Path must start with input token");

        // Verify signature and nonce in a separate scope
        {
            bytes32 digest = getSwapRequestHash(owner, token, amountIn, amountOutMin, path, to, deadline, nonce);
            address signer = ECDSA.recover(digest, signature);
            require(signer == owner, "Invalid signature");
            require(nonce == nonces[owner], "Invalid nonce");
            nonces[owner]++;
        }

        // Execute permit transfer
        permit2.permitTransferFrom(
            permit,
            IPermit2.SignatureTransferDetails({
                to: address(this),
                requestedAmount: amountIn
            }),
            owner,
            permitSignature
        );

        // Execute swap
        require(IERC20(token).approve(address(router), amountIn), "Approval failed");
        router.swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline);

        emit SwapExecuted(owner, token, amountIn, amountOutMin, to, nonce);
    }

    /// @notice Emergency function to recover stuck tokens (only for tokens that aren't being actively swapped)
    function emergencyWithdraw(address token, uint256 amount, address recipient) external {
        require(msg.sender == address(this), "Only contract can call"); // This would need proper access control in production
        require(IERC20(token).transfer(recipient, amount), "Transfer failed");
    }
}