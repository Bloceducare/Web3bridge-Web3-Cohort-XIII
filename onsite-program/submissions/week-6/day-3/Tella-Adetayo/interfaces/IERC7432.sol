// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC7432 {
    struct Role {
        bytes32 roleId;
        address tokenAddress;
        uint256 tokenId;
        address recipient;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    event TokenLocked(address indexed owner, address indexed tokenAddress, uint256 tokenId);
    event RoleGranted(
        address indexed tokenAddress,
        uint256 indexed tokenId,
        bytes32 indexed roleId,
        address owner,
        address recipient,
        uint64 expirationDate,
        bool revocable,
        bytes data
    );
    event RoleRevoked(address indexed tokenAddress, uint256 indexed tokenId, bytes32 indexed roleId);
    event TokenUnlocked(address indexed owner, address indexed tokenAddress, uint256 indexed tokenId);
    event RoleApprovalForAll(address indexed tokenAddress, address indexed operator, bool isApproved);

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
}