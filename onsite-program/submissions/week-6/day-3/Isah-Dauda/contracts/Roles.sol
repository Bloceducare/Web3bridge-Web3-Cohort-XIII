// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC7432} from "./interfaces/IERC7432.sol";


contract Roles is IERC7432, EIP712 {
  

    // mapping role => tokenAddress => tokenId => grantee => expirationDate
    mapping(bytes32 => mapping(address => mapping(uint256 => mapping(address => uint64))))
        private _roles;

    mapping(uint256 => address) private _delegates;

    bytes32 private constant GRANT_ROLE_TYPEHASH =
        keccak256("GrantRole(bytes32 role,address tokenAddress,uint256 tokenId,address grantee,uint64 expirationDate,uint256 nonce)");

    mapping(address => uint256) public nonces;


    event RoleDelegated(uint256 indexed tokenId, address indexed from, address indexed to);

    error NotTokenOwnerOrDelegate(address caller, address tokenAddress, uint256 tokenId);
    error InvalidSignature();


    constructor() EIP712("Roles", "1") {}

  
    function grantRoleBySignature(
        address signer,
        bytes32 role,
        address tokenAddress,
        uint256 tokenId,
        address grantee,
        uint64 expirationDate,
        bytes calldata signature
    ) external {
        if (expirationDate <= block.timestamp) revert InvalidExpirationDate();
        _verifyManager(signer, tokenAddress, tokenId);

        uint256 nonce = nonces[signer]++;
        bytes32 structHash = keccak256(abi.encode(GRANT_ROLE_TYPEHASH, role, tokenAddress, tokenId, grantee, expirationDate, nonce));
        bytes32 digest = _hashTypedDataV4(structHash);

        address recoveredSigner = ECDSA.recover(digest, signature);
        if (recoveredSigner != signer || recoveredSigner == address(0)) {
            revert InvalidSignature();
        }

        _grantRole(role, tokenAddress, tokenId, grantee, expirationDate);
    }
    
    function grantRole(
        bytes32 role,
        address tokenAddress,
        uint256 tokenId,
        address grantee,
        uint64 expirationDate
    ) external {
        if (expirationDate <= block.timestamp) revert InvalidExpirationDate();
        _verifyManager(msg.sender, tokenAddress, tokenId);
        _grantRole(role, tokenAddress, tokenId, grantee, expirationDate);
    }

    function revokeRole(
        bytes32 role,
        address tokenAddress,
        uint256 tokenId,
        address grantee
    ) external {
        _verifyManager(msg.sender, tokenAddress, tokenId);
        delete _roles[role][tokenAddress][tokenId][grantee];
        emit RoleRevoked(role, tokenAddress, tokenId, grantee);
    }

    function delegate(uint256 tokenId, address delegatee, address tokenAddress) external {
        if (IERC721(tokenAddress).ownerOf(tokenId) != msg.sender) {
            revert NotRoleManager(msg.sender, bytes32(0), tokenAddress, tokenId);
        }
        address currentDelegate = _delegates[tokenId];
        _delegates[tokenId] = delegatee;
        emit RoleDelegated(tokenId, currentDelegate, delegatee);
    }


    function _grantRole(bytes32 role, address tokenAddress, uint256 tokenId, address grantee, uint64 expirationDate) internal {
        _roles[role][tokenAddress][tokenId][grantee] = expirationDate;
        emit RoleGranted(role, tokenAddress, tokenId, grantee, expirationDate);
    }

    function _verifyManager(address caller, address tokenAddress, uint256 tokenId) internal view {
        address owner = IERC721(tokenAddress).ownerOf(tokenId);
        address delegate = _delegates[tokenId];
        if (caller != owner && (delegate == address(0) || caller != delegate)) {
            revert NotTokenOwnerOrDelegate(caller, tokenAddress, tokenId);
        }
    }

}