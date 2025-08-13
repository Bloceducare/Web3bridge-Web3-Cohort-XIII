// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IERC7432 Non-Fungible Token Roles
 * @dev See https://eips.ethereum.org/EIPS/eip-7432
 */
interface IERC7432 {
    /**
     * @dev Emitted when a role is granted to an NFT
     */
    event RoleGranted(
        bytes32 indexed role,
        address indexed tokenAddress,
        uint256 indexed tokenId,
        address account,
        uint256 expirationTime
    );

    /**
     * @dev Emitted when a role is revoked from an NFT
     */
    event RoleRevoked(
        bytes32 indexed role,
        address indexed tokenAddress,
        uint256 indexed tokenId,
        address account
    );

    /**
     * @dev Grants a role to an NFT
     * @param role The role to grant
     * @param tokenAddress The address of the NFT contract
     * @param tokenId The ID of the NFT
     * @param account The account that can use the role
     * @param expirationTime Unix timestamp when the role expires (0 for no expiration)
     */
    function grantRole(
        bytes32 role,
        address tokenAddress,
        uint256 tokenId,
        address account,
        uint256 expirationTime
    ) external;

    /**
     * @dev Revokes a role from an NFT
     * @param role The role to revoke
     * @param tokenAddress The address of the NFT contract
     * @param tokenId The ID of the NFT
     * @param account The account that has the role
     */
    function revokeRole(
        bytes32 role,
        address tokenAddress,
        uint256 tokenId,
        address account
    ) external;

    /**
     * @dev Checks if an account has a specific role for an NFT
     * @param role The role to check
     * @param tokenAddress The address of the NFT contract
     * @param tokenId The ID of the NFT
     * @param account The account to check
     * @return Whether the account has the role and if it's not expired
     */
    function hasRole(
        bytes32 role,
        address tokenAddress,
        uint256 tokenId,
        address account
    ) external view returns (bool);
}
