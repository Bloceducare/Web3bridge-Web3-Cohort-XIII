// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC7432 {
    struct RoleAssignment {
        bytes32 role;
        address account;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    struct RoleData {
        address recipient;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    event RoleGranted(
        bytes32 indexed role,
        uint256 indexed tokenId,
        address indexed account,
        uint64 expirationDate,
        bool revocable,
        bytes data
    );

    event RoleRevoked(bytes32 indexed role, uint256 indexed tokenId, address indexed account);

    /// @notice Grants a role to a specific account for a given NFT
    /// @param _role The role identifier
    /// @param _tokenId The token ID
    /// @param _account The account to grant the role to
    /// @param _expirationDate The expiration date of the role (0 for non-expiring)
    /// @param _revocable Whether the role can be revoked
    /// @param _data Additional data for the role
    function grantRole(
        bytes32 _role,
        uint256 _tokenId,
        address _account,
        uint64 _expirationDate,
        bool _revocable,
        bytes calldata _data
    ) external;

    /// @notice Revokes a role from an account for a given NFT
    /// @param _role The role identifier
    /// @param _tokenId The token ID
    /// @param _account The account to revoke the role from
    function revokeRole(bytes32 _role, uint256 _tokenId, address _account) external;

    /// @notice Checks if an account has a specific role for a given NFT
    /// @param _role The role identifier
    /// @param _tokenId The token ID
    /// @param _account The account to check
    /// @return Whether the account has the role
    function hasRole(bytes32 _role, uint256 _tokenId, address _account) external view returns (bool);

    /// @notice Gets role data for a specific role assignment
    /// @param _role The role identifier
    /// @param _tokenId The token ID
    /// @param _account The account
    /// @return The role data
    function roleData(bytes32 _role, uint256 _tokenId, address _account) external view returns (RoleData memory);

    /// @notice Gets the expiration date of a role
    /// @param _role The role identifier
    /// @param _tokenId The token ID
    /// @param _account The account
    /// @return The expiration date (0 for non-expiring)
    function roleExpirationDate(bytes32 _role, uint256 _tokenId, address _account) external view returns (uint64);

    /// @notice Checks if a role is revocable
    /// @param _role The role identifier
    /// @param _tokenId The token ID
    /// @param _account The account
    /// @return Whether the role is revocable
    function isRoleRevocable(bytes32 _role, uint256 _tokenId, address _account) external view returns (bool);
}
