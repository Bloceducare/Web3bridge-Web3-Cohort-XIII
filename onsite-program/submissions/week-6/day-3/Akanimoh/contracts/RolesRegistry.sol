// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract RolesRegistry is ERC165 {
    struct Role {
        address recipient;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    mapping(address => mapping(uint256 => mapping(bytes32 => Role))) private _roles;
    mapping(address => mapping(address => bool)) private _roleApprovalForAll;

    event RoleGranted(
        address indexed tokenAddress,
        uint256 indexed tokenId,
        bytes32 indexed roleId,
        address recipient,
        uint64 expirationDate,
        bool revocable,
        bytes data
    );
    event RoleRevoked(address indexed tokenAddress, uint256 indexed tokenId, bytes32 indexed roleId);
    event RoleApprovalForAll(address indexed tokenAddress, address indexed operator, bool approved);

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC7432).interfaceId || super.supportsInterface(interfaceId);
    }

    function grantRole(
        address tokenAddress,
        uint256 tokenId,
        bytes32 roleId,
        address recipient,
        uint64 expirationDate,
        bool revocable,
        bytes calldata data
    ) external {
        require(IERC721(tokenAddress).ownerOf(tokenId) == msg.sender || 
                _roleApprovalForAll[tokenAddress][msg.sender], 
                "Not authorized");
        require(recipient != address(0), "Invalid recipient");
        
        _roles[tokenAddress][tokenId][roleId] = Role(recipient, expirationDate, revocable, data);
        emit RoleGranted(tokenAddress, tokenId, roleId, recipient, expirationDate, revocable, data);
    }

    function revokeRole(address tokenAddress, uint256 tokenId, bytes32 roleId) external {
        Role memory role = _roles[tokenAddress][tokenId][roleId];
        require(role.revocable, "Role not revocable");
        require(IERC721(tokenAddress).ownerOf(tokenId) == msg.sender || 
                _roleApprovalForAll[tokenAddress][msg.sender], 
                "Not authorized");

        delete _roles[tokenAddress][tokenId][roleId];
        emit RoleRevoked(tokenAddress, tokenId, roleId);
    }

    function setRoleApprovalForAll(address tokenAddress, address operator, bool approved) external {
        _roleApprovalForAll[tokenAddress][operator] = approved;
        emit RoleApprovalForAll(tokenAddress, operator, approved);
    }

    function recipientOf(address tokenAddress, uint256 tokenId, bytes32 roleId) 
        external view returns (address) {
        return _roles[tokenAddress][tokenId][roleId].recipient;
    }

    function roleData(address tokenAddress, uint256 tokenId, bytes32 roleId) 
        external view returns (bytes memory) {
        return _roles[tokenAddress][tokenId][roleId].data;
    }

    function roleExpirationDate(address tokenAddress, uint256 tokenId, bytes32 roleId) 
        external view returns (uint64) {
        return _roles[tokenAddress][tokenId][roleId].expirationDate;
    }

    function isRoleRevocable(address tokenAddress, uint256 tokenId, bytes32 roleId) 
        external view returns (bool) {
        return _roles[tokenAddress][tokenId][roleId].revocable;
    }

    function hasValidRole(address tokenAddress, uint256 tokenId, bytes32 roleId) 
        external view returns (bool) {
        Role memory role = _roles[tokenAddress][tokenId][roleId];
        return role.recipient != address(0) && 
               (role.expirationDate == 0 || role.expirationDate > block.timestamp);
    }
}

interface IERC7432 {
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
    function setRoleApprovalForAll(address tokenAddress, address operator, bool approved) external;
    function recipientOf(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (address);
    function roleData(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (bytes memory);
    function roleExpirationDate(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (uint64);
    function isRoleRevocable(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (bool);
}