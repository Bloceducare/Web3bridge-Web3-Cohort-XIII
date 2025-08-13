// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {IERC7432} from "./IEP7432.sol";

contract DAOMembershipNFT is ERC721, Ownable, IERC7432 {
    uint256 private _nextId;
    mapping(address => bool) public hasMembership;

    struct RoleCore {
        address recipient;
        uint64 expirationDate;
        bool revocable;
        bool exists;
        bytes data;
    }
    mapping(uint256 => mapping(bytes32 => RoleCore)) private _roles;

    mapping(uint256 => bool) private _locked;

    mapping(address => mapping(address => bool)) private _roleOperatorApproved;

    constructor() ERC721("DAO Membership", "DAOM") Ownable(msg.sender) {}

    error AlreadyMember();
    
    function mintMembership(address to) external onlyOwner returns (uint256) {
        if (hasMembership[to]) revert AlreadyMember();
        _nextId += 1;
        uint256 tokenId = _nextId;
        _safeMint(to, tokenId);
        hasMembership[to] = true;
        return tokenId;
    }

    function _update(address to, uint256 tokenId, address tokenOwner) internal override returns (address) {
        require(!_locked[tokenId], "Token is locked");
        address from = super._update(to, tokenId, tokenOwner);
        return from;
    }


    function grantRole(Role calldata r) external override onlyOwner {
        require(r.tokenAddress == address(this), "Wrong token contract");
        require(hasMembership[ownerOf(r.tokenId)], "Invalid tokenId");
        address currentOwner = ERC721.ownerOf(r.tokenId);

        RoleCore storage slot = _roles[r.tokenId][r.roleId];
        slot.recipient = r.recipient;
        slot.expirationDate = r.expirationDate;
        slot.revocable = r.revocable;
        slot.data = r.data;
        slot.exists = true;

        if (!_locked[r.tokenId]) {
            _locked[r.tokenId] = true;
            emit TokenLocked(currentOwner, address(this), r.tokenId);
        }

        emit RoleGranted(address(this), r.tokenId, r.roleId, currentOwner, r.recipient, r.expirationDate, r.revocable, r.data);
    }

    function revokeRole(address tokenAddress, uint256 tokenId, bytes32 roleId) external override onlyOwner {
        require(tokenAddress == address(this), "Wrong token contract");
        require(hasMembership[ownerOf(tokenId)], "Invalid tokenId");
        RoleCore storage slot = _roles[tokenId][roleId];
        require(slot.exists, "Role not set");
        require(slot.revocable, "Role not revocable");
        delete _roles[tokenId][roleId];
        emit RoleRevoked(address(this), tokenId, roleId);
    }

    function unlockToken(address tokenAddress, uint256 tokenId) external onlyOwner {
        require(hasMembership[ownerOf(tokenId)], "Invalid tokenId");
        if (_locked[tokenId]) {
            _locked[tokenId] = false;
            address currentOwner = ERC721.ownerOf(tokenId);
            emit TokenUnlocked(currentOwner, address(this), tokenId);
        }
    }

    function setRoleApprovalForAll(address tokenAddress, address operator, bool approved) external override {
        require(tokenAddress == address(this), "Wrong token contract");
        _roleOperatorApproved[msg.sender][operator] = approved;
        emit RoleApprovalForAll(address(this), operator, approved);
    }

    function ownerOf(address tokenAddress, uint256 tokenId) external view returns (address owner_) {
        if (tokenAddress != address(this)) return address(0);
        return ERC721.ownerOf(tokenId);
    }

    function recipientOf(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (address recipient_) {
        if (tokenAddress != address(this)) return address(0);
        RoleCore storage slot = _roles[tokenId][roleId];
        if (!slot.exists) return address(0);
        if (slot.expirationDate < block.timestamp) return address(0);
        return slot.recipient;
    }

    function roleData(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (bytes memory data_) {
        if (tokenAddress != address(this)) return "";
        RoleCore storage slot = _roles[tokenId][roleId];
        if (!slot.exists || slot.expirationDate < block.timestamp) return "";
        return slot.data;
    }

    function roleExpirationDate(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (uint64 expirationDate_) {
        if (tokenAddress != address(this)) return 0;
        RoleCore storage slot = _roles[tokenId][roleId];
        if (!slot.exists) return 0;
        return slot.expirationDate;
    }

    function isRoleRevocable(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (bool revocable_) {
        if (tokenAddress != address(this)) return false;
        RoleCore storage slot = _roles[tokenId][roleId];
        return slot.exists && slot.revocable;
    }

    function isRoleApprovedForAll(address tokenAddress, address owner_, address operator) external view returns (bool) {
        if (tokenAddress != address(this)) return false;
        return _roleOperatorApproved[owner_][operator];
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return hasMembership[ownerOf(tokenId)];
    }

    function isLocked(uint256 tokenId) external view returns (bool) {
        return _locked[tokenId];
    }
}