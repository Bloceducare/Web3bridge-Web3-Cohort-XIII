// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title RoleRegistry
 * @dev Implementation of ERC-7432 Non-Fungible Token Roles
 */
contract RoleRegistry {
    struct RoleData {
        address grantor;
        uint64 expiration;
    }

    // tokenContract => tokenId => role => RoleData
    mapping(address => mapping(uint256 => mapping(bytes32 => RoleData))) private _roles;

    event RoleGranted(
        address indexed tokenContract,
        uint256 indexed tokenId,
        bytes32 indexed role,
        address grantor,
        uint64 expiration
    );
    event RoleRevoked(
        address indexed tokenContract,
        uint256 indexed tokenId,
        bytes32 indexed role,
        address grantor
    );

    function hasRole(
        address tokenContract,
        uint256 tokenId,
        bytes32 role,
        address account
    ) external view returns (bool) {
        RoleData memory data = _roles[tokenContract][tokenId][role];
        return data.grantor == account && (data.expiration == 0 || data.expiration >= block.timestamp);
    }

    function getRoleExpiration(
        address tokenContract,
        uint256 tokenId,
        bytes32 role
    ) external view returns (uint64) {
        return _roles[tokenContract][tokenId][role].expiration;
    }

    function grantRole(
        address tokenContract,
        uint256 tokenId,
        bytes32 role,
        uint64 expiration
    ) external {
        require(
            IERC721(tokenContract).ownerOf(tokenId) == msg.sender,
            "RoleRegistry: only NFT owner can grant roles"
        );

        _roles[tokenContract][tokenId][role] = RoleData({
            grantor: msg.sender,
            expiration: expiration
        });

        emit RoleGranted(tokenContract, tokenId, role, msg.sender, expiration);
    }

    function revokeRole(
        address tokenContract,
        uint256 tokenId,
        bytes32 role
    ) external {
        require(
            _roles[tokenContract][tokenId][role].grantor == msg.sender,
            "RoleRegistry: only role grantor can revoke"
        );

        delete _roles[tokenContract][tokenId][role];
        emit RoleRevoked(tokenContract, tokenId, role, msg.sender);
    }
}