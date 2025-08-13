// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IERC7432.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

abstract contract ERC7432 is IERC7432, AccessControl {
    bytes32 public constant ROLE_ADMIN = keccak256("ROLE_ADMIN");
    mapping(bytes32 => mapping(uint256 => uint64)) private _roleExpirations;
    mapping(bytes32 => mapping(uint256 => bool)) private _roleAssigned;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ROLE_ADMIN, msg.sender);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IERC7432).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function grantRole(
        bytes32 role,
        uint256 tokenId,
        uint64 expiration
    ) external override {
        require(
            hasRole(ROLE_ADMIN, msg.sender) || _isTokenOwner(tokenId, msg.sender),
            "ERC7432: insufficient permission"
        );
        require(_tokenExists(tokenId), "ERC7432: token does not exist");

        _roleExpirations[role][tokenId] = expiration;
        _roleAssigned[role][tokenId] = true;

        emit RoleGranted(role, tokenId, msg.sender);

        if (expiration > 0) {
            emit RoleExpirationChanged(role, tokenId, expiration);
        }
    }

    function revokeRole(bytes32 role, uint256 tokenId) external override {
        require(
            hasRole(ROLE_ADMIN, msg.sender) || _isTokenOwner(tokenId, msg.sender),
            "ERC7432: insufficient permission"
        );

        delete _roleExpirations[role][tokenId];
        _roleAssigned[role][tokenId] = false;

        emit RoleRevoked(role, tokenId, msg.sender);
    }

    function hasRole(bytes32 role, uint256 tokenId)
        external
        view
        override
        returns (bool)
    {
        if (!_roleAssigned[role][tokenId]) {
            return false;
        }

        uint64 expiration = _roleExpirations[role][tokenId];
        return expiration == 0 || expiration > block.timestamp;
    }

    function getRoleExpiration(bytes32 role, uint256 tokenId)
        external
        view
        override
        returns (uint64)
    {
        return _roleExpirations[role][tokenId];
    }

    function hasRoleAssigned(bytes32 role, uint256 tokenId)
        external
        view
        override
        returns (bool)
    {
        return _roleAssigned[role][tokenId];
    }

    function _isTokenOwner(uint256 tokenId, address account)
        internal
        view
        virtual
        returns (bool);

    function _tokenExists(uint256 tokenId) internal view virtual returns (bool);

    function _hasValidRole(bytes32 role, uint256 tokenId)
        internal
        view
        returns (bool)
    {
        if (!_roleAssigned[role][tokenId]) {
            return false;
        }

        uint64 expiration = _roleExpirations[role][tokenId];
        return expiration == 0 || expiration > block.timestamp;
    }
}
