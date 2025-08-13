// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title ERC-7432 Non-Fungible Token Roles
/// @dev See https://eips.ethereum.org/EIPS/eip-7432
/// Note: the ERC-165 identifier for this interface is 0xd00ca5cf.
/* is ERC165 */ interface IERC7432 {
    struct Role {
        bytes32 roleId;
        address tokenAddress;
        uint256 tokenId;
        address recipient;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    /// @notice Event emitted when a role is granted
    event RoleGranted(
        bytes32 indexed roleId,
        address indexed recipient,
        uint256 expirationDate
    );

    /// @notice Event emitted when a role is revoked
    event RoleRevoked(bytes32 indexed roleId, address indexed recipient);

    /// @notice Assign a role to a recipient based on NFT ownership
    function assignRole(
        bytes32 roleId,
        uint256 tokenId,
        address recipient,
        uint256 expirationDate,
        bool revocable
    ) external;

    /// @notice Revoke a previously assigned role
    function revokeRole(bytes32 roleId) external;

    /// @notice Check if a user currently holds a valid role
    function hasRole(address user, bytes32 roleId) external view returns (bool);

    /// @notice Get all role IDs assigned to a user
    function getRoles(address user) external view returns (bytes32[] memory);

    /// @notice Get full role data by role ID
    function getRoleData(bytes32 roleId) external view returns (Role memory);
}
