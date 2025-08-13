// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

contract RolesRegistry is ERC165 {
    struct Role {
        bytes32 roleId;
        address tokenAddress;
        uint256 tokenId;
        address recipient;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    mapping(bytes32 => mapping(address => mapping(uint256 => Role))) private roles;
    mapping(address => mapping(address => bool)) private roleApprovalForAll;

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

    event RoleRevoked(
        address indexed tokenAddress,
        uint256 indexed tokenId,
        bytes32 indexed roleId
    );

    function grantRole(Role memory _role) external {
        require(
            IERC721(_role.tokenAddress).ownerOf(_role.tokenId) == msg.sender ||
            roleApprovalForAll[_role.tokenAddress][msg.sender],
            "Not authorized"
        );
        roles[_role.roleId][_role.tokenAddress][_role.tokenId] = _role;
        emit RoleGranted(
            _role.tokenAddress,
            _role.tokenId,
            _role.roleId,
            IERC721(_role.tokenAddress).ownerOf(_role.tokenId),
            _role.recipient,
            _role.expirationDate,
            _role.revocable,
            _role.data
        );
    }

    function revokeRole(address tokenAddress, uint256 tokenId, bytes32 roleId) external {
        require(
            IERC721(tokenAddress).ownerOf(tokenId) == msg.sender ||
            roleApprovalForAll[tokenAddress][msg.sender],
            "Not authorized"
        );
        delete roles[roleId][tokenAddress][tokenId];
        emit RoleRevoked(tokenAddress, tokenId, roleId);
    }

    function recipientOf(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (address) {
        return roles[roleId][tokenAddress][tokenId].recipient;
    }

    function roleExpirationDate(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (uint64) {
        return roles[roleId][tokenAddress][tokenId].expirationDate;
    }

    function isRoleRevocable(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (bool) {
        return roles[roleId][tokenAddress][tokenId].revocable;
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == type(IERC7432).interfaceId || super.supportsInterface(interfaceId);
    }
}

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
}
interface IERC7432 {
    function recipientOf(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (address);
}