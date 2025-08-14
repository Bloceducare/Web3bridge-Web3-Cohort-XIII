// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC7432 {
    event RoleGranted(bytes32 indexed role, address indexed account, uint256 indexed tokenId, address operator);
    event RoleRevoked(bytes32 indexed role, address indexed account, uint256 indexed tokenId, address operator);
    
    function hasRole(bytes32 role, address account, uint256 tokenId) external view returns (bool);
    function getRoleMemberCount(bytes32 role, uint256 tokenId) external view returns (uint256);
    function getRoleMember(bytes32 role, uint256 tokenId, uint256 index) external view returns (address);
    function getRoleAdmin(bytes32 role) external view returns (bytes32);
    function grantRole(bytes32 role, address account, uint256 tokenId) external;
    function revokeRole(bytes32 role, address account, uint256 tokenId) external;
    function renounceRole(bytes32 role, uint256 tokenId) external;
} 