// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


interface IERC7432 {
    event RoleGranted(bytes32 indexed role, uint256 indexed tokenId, address indexed account, uint64 expirationDate, bytes data);
    
    event RoleRevoked(bytes32 indexed role, uint256 indexed tokenId, address indexed account);
    
    event RoleApprovalForAll(address indexed owner, address indexed operator, bool approved);

    
    function grantRole(
        bytes32 role,
        uint256 tokenId,
        address account,
        uint64 expirationDate,
        bytes calldata data
    ) external;

    
    function revokeRole(
        bytes32 role,
        uint256 tokenId,
        address account
    ) external;

    
    function hasRole(
        bytes32 role,
        uint256 tokenId,
        address account
    ) external view returns (bool);

    
    function roleExpirationDate(
        bytes32 role,
        uint256 tokenId,
        address account
    ) external view returns (uint64);

    
    function roleData(
        bytes32 role,
        uint256 tokenId,
        address account
    ) external view returns (bytes memory);

   
    function setRoleApprovalForAll(address operator, bool approved) external;

    
    function isRoleApprovedForAll(address owner, address operator) external view returns (bool);
}
