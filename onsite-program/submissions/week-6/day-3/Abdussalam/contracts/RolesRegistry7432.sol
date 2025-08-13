// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.26;

import "../Interfaces/IERC7432.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

contract RolesRegistry7432 is IERC7432, ERC165 {
    struct Assignment {
        address ownerAtGrant;
        address recipient;
        uint64  expiration;
        bool    revocable;
        bytes   data;
        bool    exists;
    }

    mapping(address => mapping(uint256 => mapping(bytes32 => Assignment))) private _roles;
    mapping(address => mapping(address => mapping(address => bool))) private _approvals;
    mapping(address => mapping(uint256 => bool)) private _locked;

    modifier onlyOwnerOrApproved(address token, uint256 tokenId) {
        address nftOwner = IERC721(token).ownerOf(tokenId);
        require(msg.sender == nftOwner || _approvals[token][nftOwner][msg.sender], "Not owner nor approved");
        _;
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == type(IERC7432).interfaceId || super.supportsInterface(interfaceId);
    }

    // Add this function to your RolesRegistry7432 contract
function hasRole(address tokenAddress, uint256 tokenId, bytes32 role) external view returns (bool) {
    Assignment storage a = _roles[tokenAddress][tokenId][role];
    if (!a.exists) return false;
    if (a.expiration != type(uint64).max && a.expiration < block.timestamp) return false;
    return true;
}

    function grantRole(Role calldata _role) external override onlyOwnerOrApproved(_role.tokenAddress, _role.tokenId) {
        Assignment storage a = _roles[_role.tokenAddress][_role.tokenId][_role.roleId];
        address currentOwner = IERC721(_role.tokenAddress).ownerOf(_role.tokenId);

        a.ownerAtGrant = currentOwner;
        a.recipient = _role.recipient;
        a.expiration = _role.expirationDate;
        a.revocable = _role.revocable;
        a.data = _role.data;
        a.exists = true;

        if (!_locked[_role.tokenAddress][_role.tokenId]) {
            _locked[_role.tokenAddress][_role.tokenId] = true;
            emit TokenLocked(currentOwner, _role.tokenAddress, _role.tokenId);
        }

        emit RoleGranted(
            _role.tokenAddress,
            _role.tokenId,
            _role.roleId,
            currentOwner,
            _role.recipient,
            _role.expirationDate,
            _role.revocable,
            _role.data
        );
    }

    function revokeRole(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external override {
        Assignment storage a = _roles[_tokenAddress][_tokenId][_roleId];
        require(a.exists, "No role");

        address nftOwner = IERC721(_tokenAddress).ownerOf(_tokenId);
        bool ownerOrApproved = (msg.sender == nftOwner) || _approvals[_tokenAddress][nftOwner][msg.sender];

        if (!a.revocable) {
            require(msg.sender == a.recipient, "Only recipient can revoke");
        } else {
            require(ownerOrApproved || msg.sender == a.recipient, "Not authorized");
        }

        delete _roles[_tokenAddress][_tokenId][_roleId];
        emit RoleRevoked(_tokenAddress, _tokenId, _roleId);
    }

    function unlockToken(address _tokenAddress, uint256 _tokenId) external override {
        address nftOwner = IERC721(_tokenAddress).ownerOf(_tokenId);
        require(msg.sender == nftOwner || _approvals[_tokenAddress][nftOwner][msg.sender], "Not authorized");

        _locked[_tokenAddress][_tokenId] = false;
        emit TokenUnlocked(nftOwner, _tokenAddress, _tokenId);
    }

    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _approved) external override {
        _approvals[_tokenAddress][msg.sender][_operator] = _approved;
        emit RoleApprovalForAll(_tokenAddress, _operator, _approved);
    }

    function ownerOf(address _tokenAddress, uint256 _tokenId) external view override returns (address owner_) {
        owner_ = IERC721(_tokenAddress).ownerOf(_tokenId);
    }

    function recipientOf(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external view override returns (address) {
        Assignment storage a = _roles[_tokenAddress][_tokenId][_roleId];
        if (!a.exists) return address(0);
        if (a.expiration != type(uint64).max && a.expiration < block.timestamp) return address(0);
        return a.recipient;
    }

    function roleData(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external view override returns (bytes memory) {
        Assignment storage a = _roles[_tokenAddress][_tokenId][_roleId];
        return a.exists ? a.data : bytes("");
    }

    function roleExpirationDate(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external view override returns (uint64) {
        Assignment storage a = _roles[_tokenAddress][_tokenId][_roleId];
        return a.exists ? a.expiration : 0;
    }

    function isRoleRevocable(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external view override returns (bool) {
        Assignment storage a = _roles[_tokenAddress][_tokenId][_roleId];
        return a.exists && a.revocable;
    }

    function isRoleApprovedForAll(address _tokenAddress, address _owner, address _operator) external view override returns (bool) {
        return _approvals[_tokenAddress][_owner][_operator];
    }
}


