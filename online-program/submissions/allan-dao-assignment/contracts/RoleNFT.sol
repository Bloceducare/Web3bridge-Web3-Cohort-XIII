// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC7432.sol";

contract RoleNFT is ERC721, Ownable, IERC7432 {
    struct RoleData {
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    mapping(bytes32 => mapping(uint256 => mapping(address => RoleData))) private _roles;
    uint256 private _tokenIdCounter;

    constructor() ERC721("DAO Role NFT", "DRNFT") Ownable(msg.sender) {}

    function mint(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _mint(to, tokenId);
        return tokenId;
    }

    function grantRole(
        bytes32 role,
        uint256 tokenId,
        address account,
        uint64 expirationDate,
        bool revocable,
        bytes calldata data
    ) external override {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender || owner() == msg.sender, "Not authorized");
        
        _roles[role][tokenId][account] = RoleData(expirationDate, revocable, data);
        emit RoleGranted(role, tokenId, account, expirationDate, revocable, data);
    }

    function revokeRole(bytes32 role, uint256 tokenId, address account) external override {
        require(_exists(tokenId), "Token does not exist");
        require(
            ownerOf(tokenId) == msg.sender || 
            owner() == msg.sender || 
            _roles[role][tokenId][account].revocable,
            "Not authorized to revoke"
        );
        
        delete _roles[role][tokenId][account];
        emit RoleRevoked(role, tokenId, account);
    }

    function hasRole(bytes32 role, uint256 tokenId, address account) external view override returns (bool) {
        if (!_exists(tokenId)) return false;
        RoleData memory roleInfo = _roles[role][tokenId][account];
        return roleInfo.expirationDate > block.timestamp;
    }

    function roleExpirationDate(bytes32 role, uint256 tokenId, address account) external view override returns (uint64) {
        return _roles[role][tokenId][account].expirationDate;
    }

    function isRoleRevocable(bytes32 role, uint256 tokenId, address account) external view override returns (bool) {
        return _roles[role][tokenId][account].revocable;
    }

    function roleData(bytes32 role, uint256 tokenId, address account) external view override returns (bytes memory) {
        return _roles[role][tokenId][account].data;
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId < _tokenIdCounter;
    }
}