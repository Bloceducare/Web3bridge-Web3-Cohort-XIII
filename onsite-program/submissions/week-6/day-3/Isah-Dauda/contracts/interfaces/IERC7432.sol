// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC7432 {

    event RoleGranted(bytes32 indexed role,address indexed tokenAddress,uint256 indexed tokenId,address grantee,uint64 expirationDate);

    event RoleRevoked(bytes32 indexed role,address indexed tokenAddress, uint256 indexed tokenId, address grantee);

    error InvalidExpirationDate();
    error NotRoleManager(address caller, bytes32 role, address tokenAddress, uint256 tokenId);


    function grantRole( bytes32 role, address tokenAddress,uint256 tokenId, address grantee, uint64 expirationDate) external;

    function revokeRole(bytes32 role,address tokenAddress,uint256 tokenId,address grantee) external;

    function hasRole(bytes32 role,address tokenAddress,uint256 tokenId, address grantee) external view returns (bool);

    function roleExpirationDate(bytes32 role,address tokenAddress,uint256 tokenId,address grantee) external view returns (uint64);

    function isRoleManager( bytes32 role, address tokenAddress, uint256 tokenId, address manager) external view returns (bool);
}