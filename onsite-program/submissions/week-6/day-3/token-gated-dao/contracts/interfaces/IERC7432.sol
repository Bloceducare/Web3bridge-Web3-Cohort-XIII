// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC7432 {
    event RoleGranted(
        bytes32 indexed role,
        uint256 indexed tokenId,
        address indexed grantor
    );

    event RoleRevoked(
        bytes32 indexed role,
        uint256 indexed tokenId,
        address indexed revoker
    );

    event RoleExpirationChanged(
        bytes32 indexed role,
        uint256 indexed tokenId,
        uint64 expiration
    );

    function grantRole(
        bytes32 role,
        uint256 tokenId,
        uint64 expiration
    ) external;

    function revokeRole(bytes32 role, uint256 tokenId) external;

    function hasRole(bytes32 role, uint256 tokenId) external view returns (bool);

    function getRoleExpiration(bytes32 role, uint256 tokenId) external view returns (uint64);

    function hasRoleAssigned(bytes32 role, uint256 tokenId) external view returns (bool);
}