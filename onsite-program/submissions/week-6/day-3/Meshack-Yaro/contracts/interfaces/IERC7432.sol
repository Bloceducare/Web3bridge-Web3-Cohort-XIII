// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC7432 {
    struct RoleData {
        address recipient;
        uint64 issuance;
        uint64 expiration;
        bytes data;
        bool revocable;
    }

    function grantRole(
        bytes32 roleId,
        address nftContract,
        uint256 tokenId,
        address recipient,
        uint64 expiration,
        bool revocable,
        bytes calldata data
    ) external;
    function revokeRole(bytes32 roleId, address nftContract, uint256 tokenId, address recipient) external;
    function recipientOf(bytes32 roleId, address nftContract, uint256 tokenId) external view returns (address, uint64, uint64, bytes memory, bool);
    event RoleGranted(bytes32 indexed roleId, address indexed nftContract, uint256 indexed tokenId, address recipient);
    event RoleRevoked(bytes32 indexed roleId, address indexed nftContract, uint256 indexed tokenId, address recipient);
}