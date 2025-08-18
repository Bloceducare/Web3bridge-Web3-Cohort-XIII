// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28;


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

    event NFTRegistered(address indexed owner, address indexed tokenAddress, uint256 indexed tokenId);

    event RoleAssigned(
        address indexed tokenAddress,
        uint256 indexed tokenId,
        bytes32 indexed roleId,
        address owner,
        address recipient,
        uint64 expirationDate,
        bool revocable,
        bytes data
    );
    event RoleRemoved(address indexed tokenAddress, uint256 indexed tokenId, bytes32 indexed roleId);
    event NFTReleased(address indexed owner, address indexed tokenAddress, uint256 indexed tokenId);
    function grantRole(Role calldata _role) external;
    function revokeRole(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external;
    function unlockToken(address _tokenAddress, uint256 _tokenId) external;
    function ownerOf(address _tokenAddress, uint256 _tokenId) external view returns (address);
    function recipientOf(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external view returns (address);
    function roleExpirationDate(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external view returns (uint64);
    function isRoleRevocable(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external view returns (bool);
}