// SPDX-License-Identifier: CC0-1.0

pragma solidity ^0.8.28;

import {IERC7432} from "../Interfaces/IERC7432.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Role is IERC7432 {
    struct RoleData {
        address recipient;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    bytes32[] public allowedRoles;

    // roleId => isAllowed
    mapping(bytes32 => bool) public isRoleAllowed;

    // tokenAddress => tokenId => owner
    mapping(address => mapping(uint256 => address)) public originalOwners;

    // tokenAddress => tokenId => roleId => struct(recipient, expirationDate, revocable, data)
    mapping(address => mapping(uint256 => mapping(bytes32 => RoleData)))
        public roles;

    // owner => tokenAddress => operator => isApproved
    mapping(address => mapping(address => mapping(address => bool)))
        public tokenApprovals;

    constructor() {
        allowedRoles = [keccak256("UNIQUE_ROLE")];
        for (uint256 i = 0; i < allowedRoles.length; i++) {
            isRoleAllowed[allowedRoles[i]] = true;
        }
    }

    modifier onlyAllowedRole(bytes32 _roleId) {
        require(
            isRoleAllowed[_roleId],
            "NftRolesRegistryVault: role is not allowed"
        );
        _;
    }

    function grantRole(
        IERC7432.Role calldata _role
    ) external override onlyAllowedRole(_role.roleId) {
        require(
            _role.expirationDate > block.timestamp,
            "NftRolesRegistryVault: expiration date must be in the future"
        );

        address _originalOwner = _depositNft(_role.tokenAddress, _role.tokenId);

        RoleData storage _roleData = roles[_role.tokenAddress][_role.tokenId][
            _role.roleId
        ];
        require(
            _roleData.revocable || _roleData.expirationDate < block.timestamp,
            "NftRolesRegistryVault: role must be expired or revocable"
        );

        roles[_role.tokenAddress][_role.tokenId][_role.roleId] = RoleData(
            _role.recipient,
            _role.expirationDate,
            _role.revocable,
            _role.data
        );

        emit RoleGranted(
            _role.tokenAddress,
            _role.tokenId,
            _role.roleId,
            _originalOwner,
            _role.recipient,
            _role.expirationDate,
            _role.revocable,
            _role.data
        );
    }

    function revokeRole(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external override onlyAllowedRole(_roleId) {
        address _recipient = roles[_tokenAddress][_tokenId][_roleId].recipient;
        address _caller = _getApprovedCaller(
            _tokenAddress,
            _tokenId,
            _recipient
        );

        if (_caller != _recipient) {
            require(
                roles[_tokenAddress][_tokenId][_roleId].revocable ||
                    roles[_tokenAddress][_tokenId][_roleId].expirationDate <
                    block.timestamp,
                "NftRolesRegistryVault: role is not revocable nor expired"
            );
        }

        delete roles[_tokenAddress][_tokenId][_roleId];
        emit RoleRevoked(_tokenAddress, _tokenId, _roleId);
    }

    function unlockToken(
        address _tokenAddress,
        uint256 _tokenId
    ) external override {
        address originalOwner = originalOwners[_tokenAddress][_tokenId];

        require(
            !_hasNonRevocableRole(_tokenAddress, _tokenId),
            "NftRolesRegistryVault: NFT is locked"
        );

        require(
            originalOwner == msg.sender ||
                isRoleApprovedForAll(_tokenAddress, originalOwner, msg.sender),
            "NftRolesRegistryVault: sender must be owner or approved"
        );

        delete originalOwners[_tokenAddress][_tokenId];
        IERC721(_tokenAddress).transferFrom(
            address(this),
            originalOwner,
            _tokenId
        );
        emit TokenUnlocked(originalOwner, _tokenAddress, _tokenId);
    }

    function setRoleApprovalForAll(
        address _tokenAddress,
        address _operator,
        bool _approved
    ) external {
        tokenApprovals[msg.sender][_tokenAddress][_operator] = _approved;
        emit RoleApprovalForAll(_tokenAddress, _operator, _approved);
    }

    function ownerOf(
        address _tokenAddress,
        uint256 _tokenId
    ) external view returns (address owner_) {
        return originalOwners[_tokenAddress][_tokenId];
    }

    function recipientOf(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external view returns (address recipient_) {
        if (
            roles[_tokenAddress][_tokenId][_roleId].expirationDate >
            block.timestamp
        ) {
            return roles[_tokenAddress][_tokenId][_roleId].recipient;
        }
        return address(0);
    }

    function roleData(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external view returns (bytes memory data_) {
        if (
            roles[_tokenAddress][_tokenId][_roleId].expirationDate >
            block.timestamp
        ) {
            data_ = roles[_tokenAddress][_tokenId][_roleId].data;
        }
        return data_;
    }

    function roleExpirationDate(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external view returns (uint64 expirationDate_) {
        if (
            roles[_tokenAddress][_tokenId][_roleId].expirationDate >
            block.timestamp
        ) {
            return roles[_tokenAddress][_tokenId][_roleId].expirationDate;
        }
        return 0;
    }

    function isRoleRevocable(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external view returns (bool revocable_) {
        return
            roles[_tokenAddress][_tokenId][_roleId].expirationDate >
            block.timestamp &&
            roles[_tokenAddress][_tokenId][_roleId].revocable;
    }

    function isRoleApprovedForAll(
        address _tokenAddress,
        address _owner,
        address _operator
    ) public view returns (bool) {
        return tokenApprovals[_owner][_tokenAddress][_operator];
    }

    function supportsInterface(
        bytes4 interfaceId
    ) external view virtual returns (bool) {
        return interfaceId == type(IERC7432).interfaceId;
    }

    function _depositNft(
        address _tokenAddress,
        uint256 _tokenId
    ) internal returns (address originalOwner_) {
        address _currentOwner = IERC721(_tokenAddress).ownerOf(_tokenId);

        if (_currentOwner == address(this)) {
            originalOwner_ = originalOwners[_tokenAddress][_tokenId];
            require(
                originalOwner_ == msg.sender ||
                    isRoleApprovedForAll(
                        _tokenAddress,
                        originalOwner_,
                        msg.sender
                    ),
                "NftRolesRegistryVault: sender must be owner or approved"
            );
        } else {
            require(
                _currentOwner == msg.sender ||
                    isRoleApprovedForAll(
                        _tokenAddress,
                        _currentOwner,
                        msg.sender
                    ),
                "NftRolesRegistryVault: sender must be owner or approved"
            );
            IERC721(_tokenAddress).transferFrom(
                _currentOwner,
                address(this),
                _tokenId
            );
            originalOwners[_tokenAddress][_tokenId] = _currentOwner;
            originalOwner_ = _currentOwner;
            emit TokenLocked(_currentOwner, _tokenAddress, _tokenId);
        }
    }

    function _getApprovedCaller(
        address _tokenAddress,
        uint256 _tokenId,
        address _recipient
    ) internal view returns (address caller_) {
        if (
            msg.sender == _recipient ||
            isRoleApprovedForAll(_tokenAddress, _recipient, msg.sender)
        ) {
            return _recipient;
        }
        address originalOwner = originalOwners[_tokenAddress][_tokenId];
        if (
            msg.sender == originalOwner ||
            isRoleApprovedForAll(_tokenAddress, originalOwner, msg.sender)
        ) {
            return originalOwner;
        }
        revert(
            "NftRolesRegistryVault: role does not exist or sender is not approved"
        );
    }

    function _hasNonRevocableRole(
        address _tokenAddress,
        uint256 _tokenId
    ) internal view returns (bool) {
        for (uint256 i = 0; i < allowedRoles.length; i++) {
            if (
                !roles[_tokenAddress][_tokenId][allowedRoles[i]].revocable &&
                roles[_tokenAddress][_tokenId][allowedRoles[i]].expirationDate >
                block.timestamp
            ) {
                return true;
            }
        }
        return false;
    }
}
