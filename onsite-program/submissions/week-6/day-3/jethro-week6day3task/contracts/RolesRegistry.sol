// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

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

    event RoleGranted(
        address indexed tokenAddress,
        uint256 indexed tokenId,
        bytes32 indexed roleId,
        address granter,
        address recipient,
        uint64 expirationDate,
        bool revocable,
        bytes data
    );

    event RoleRevoked(
        address indexed tokenAddress,
        uint256 indexed tokenId,
        bytes32 indexed roleId
    );

    function grantRole(Role calldata role) external;
    function revokeRole(address tokenAddress, uint256 tokenId, bytes32 roleId) external;
    function recipientOf(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (address);
    function roleExpirationDate(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (uint64);
    function isRoleRevocable(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (bool);
    function roleData(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (bytes memory);
}

contract RolesRegistry is IERC7432, ERC165 {
    struct RoleData {
        address recipient;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    mapping(address => mapping(uint256 => mapping(bytes32 => RoleData))) private _roles;
    mapping(address => mapping(address => mapping(address => bool))) private _roleApprovals;

    modifier onlyNftOwnerOrApproved(address tokenAddress, uint256 tokenId, address caller) {
        address owner = IERC721(tokenAddress).ownerOf(tokenId);
        require(caller == owner || _roleApprovals[tokenAddress][owner][caller], "Not owner or approved");
        _;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC7432).interfaceId || super.supportsInterface(interfaceId);
    }

    function grantRole(Role calldata role) external override {
        address owner = IERC721(role.tokenAddress).ownerOf(role.tokenId);
        require(msg.sender == owner || _roleApprovals[role.tokenAddress][owner][msg.sender], "Not authorized to grant");

        _roles[role.tokenAddress][role.tokenId][role.roleId] = RoleData({
            recipient: role.recipient,
            expirationDate: role.expirationDate,
            revocable: role.revocable,
            data: role.data
        });

        emit RoleGranted(
            role.tokenAddress,
            role.tokenId,
            role.roleId,
            msg.sender,
            role.recipient,
            role.expirationDate,
            role.revocable,
            role.data
        );
    }

    function revokeRole(address tokenAddress, uint256 tokenId, bytes32 roleId) external override {
        RoleData storage storedRoleData = _roles[tokenAddress][tokenId][roleId];
        require(storedRoleData.recipient != address(0), "Role not assigned");
        require(storedRoleData.revocable, "Role not revocable");

        address owner = IERC721(tokenAddress).ownerOf(tokenId);
        require(msg.sender == owner || _roleApprovals[tokenAddress][owner][msg.sender], "Not authorized to revoke");

        delete _roles[tokenAddress][tokenId][roleId];
        emit RoleRevoked(tokenAddress, tokenId, roleId);
    }

    function recipientOf(address tokenAddress, uint256 tokenId, bytes32 roleId) external view override returns (address) {
        return _roles[tokenAddress][tokenId][roleId].recipient;
    }

    function roleExpirationDate(address tokenAddress, uint256 tokenId, bytes32 roleId) external view override returns (uint64) {
        return _roles[tokenAddress][tokenId][roleId].expirationDate;
    }

    function isRoleRevocable(address tokenAddress, uint256 tokenId, bytes32 roleId) external view override returns (bool) {
        return _roles[tokenAddress][tokenId][roleId].revocable;
    }

    function roleData(address tokenAddress, uint256 tokenId, bytes32 roleId) external view override returns (bytes memory) {
        return _roles[tokenAddress][tokenId][roleId].data;
    }

    function setRoleApprovalForAll(address tokenAddress, address operator, bool approved) external {
        _roleApprovals[tokenAddress][msg.sender][operator] = approved;
    }
}