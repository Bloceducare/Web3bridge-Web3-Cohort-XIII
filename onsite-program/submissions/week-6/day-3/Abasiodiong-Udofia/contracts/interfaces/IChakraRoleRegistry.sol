// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IChakraRoleRegistry {
    function grantRole(
        address tokenAddress,
        uint256 tokenId,
        bytes32 roleId,
        address recipient,
        uint64 expirationDate,
        bool revocable,
        bytes calldata data
    ) external;
    

    function revokeRole(address tokenAddress, uint256 tokenId, bytes32 roleId) external;

    function recipientOf(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (address);

    function roleExpirationDate(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (uint64);

    function isRoleRevocable(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (bool);

    function setRoleApprovalForAll(address tokenAddress, address operator, bool approved) external;

    function isRoleApprovedForAll(address tokenAddress, address owner, address operator) external view returns (bool);
}