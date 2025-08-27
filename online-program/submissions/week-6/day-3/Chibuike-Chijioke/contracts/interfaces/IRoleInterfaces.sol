// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface IERC7432 {
    function grantRole(uint256 tokenId, bytes32 role, address recipient, uint64 expirationDate) external;
    function revokeRole(uint256 tokenId, bytes32 role, address recipient) external;
    function hasRole(uint256 tokenId, bytes32 role, address recipient) external view returns (bool);
    function roleExpirationDate(uint256 tokenId, bytes32 role, address recipient) external view returns (uint64);
    function getRoleRecipients(uint256 tokenId, bytes32 role) external view returns (address[] memory);
}