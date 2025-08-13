// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IERC7432 {
    struct Role {
        address tokenAddress;
        uint256 tokenId;
        bytes32 roleId;
        address recipient;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

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

    event TokenLocked(address indexed owner, address indexed tokenAddress, uint256 indexed tokenId);

    event TokenUnlocked(address indexed owner, address indexed tokenAddress, uint256 indexed tokenId);

    event RoleApprovalForAll(address indexed tokenAddress, address indexed operator, bool approved);

    function grantRole(Role calldata _role) external;

    function revokeRole(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external;

    function unlockToken(address _tokenAddress, uint256 _tokenId) external;

    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _approved) external;

    function ownerOf(address _tokenAddress, uint256 _tokenId) external view returns (address owner_);

    function recipientOf(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external view returns (address recipient_);

    function roleData(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external view returns (bytes memory data_);

    function roleExpirationDate(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external view returns (uint64 expirationDate_);

    function isRoleRevocable(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external view returns (bool revocable_);

    function isRoleApprovedForAll(address _tokenAddress, address _owner, address _operator) external view returns (bool);

    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}