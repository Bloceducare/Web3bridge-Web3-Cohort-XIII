
// contracts/interfaces/IRolesRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

struct Role {
    address tokenAddress;
    uint256 tokenId;
    bytes32 roleId;
    address recipient;
    uint64 expirationDate;
    bool revocable;
    bytes data;
}

interface IRolesRegistry {
    event RoleGranted(
        address indexed tokenAddress,
        uint256 indexed tokenId,
        bytes32 indexed roleId,
        address grantor,
        address recipient,
        uint64 expirationDate,
        bool revocable,
        bytes data
    );

    event RoleRevoked(
        address indexed tokenAddress,
        uint256 indexed tokenId,
        bytes32 indexed roleId
    );

    event RoleApprovalForAll(
        address indexed tokenAddress,
        address indexed operator,
        bool approved
    );

    function grantRole(Role calldata _role) external;
    function revokeRole(address tokenAddress, uint256 tokenId, bytes32 roleId) external;
    function unlockToken(address tokenAddress, uint256 tokenId) external;
    function setRoleApprovalForAll(address tokenAddress, address operator, bool approved) external;

    function ownerOf(address tokenAddress, uint256 tokenId) external view returns (address owner_);
    function recipientOf(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (address recipient_);
    function roleData(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (bytes memory data_);
    function roleExpirationDate(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (uint64 expirationDate_);
    function isRoleRevocable(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (bool revocable_);
    function isRoleApprovedForAll(address tokenAddress, address owner, address operator) external view returns (bool);

    function hasActiveRole(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (bool);
    function getRoleWeight(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (uint256);
}

