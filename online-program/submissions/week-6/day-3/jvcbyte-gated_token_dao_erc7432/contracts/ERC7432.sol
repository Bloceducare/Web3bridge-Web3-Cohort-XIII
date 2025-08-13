// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "./interfaces/IERC7432.sol";

/**
 * @title ERC-7432 Non-Fungible Token Roles
 * @dev Implementation of the ERC-7432 standard for role management on NFTs
 */
contract ERC7432 is Context, IERC7432, AccessControl, IERC165 {
    // Role info structure
    struct RoleInfo {
        address account;
        uint256 expirationTime;
    }
    
    // Mapping from role to token address to token ID to role info
    mapping(bytes32 => mapping(address => mapping(uint256 => RoleInfo))) private _roles;
    
    // Admin role for managing roles
    bytes32 public constant ROLE_ADMIN = keccak256("ROLE_ADMIN");
    
    /**
     * @dev Constructor
     * @param admin Address of the admin
     */
    constructor(address admin) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(ROLE_ADMIN, admin);
    }
    
    /**
     * @dev Grants a role to an NFT
     * @param role The role to grant
     * @param tokenAddress The address of the NFT contract
     * @param tokenId The ID of the NFT
     * @param account The account that can use the role
     * @param expirationTime Unix timestamp when the role expires (0 for no expiration)
     */
    function grantRole(
        bytes32 role,
        address tokenAddress,
        uint256 tokenId,
        address account,
        uint256 expirationTime
    ) external override onlyRole(ROLE_ADMIN) {
        require(tokenAddress != address(0), "Invalid token address");
        require(account != address(0), "Invalid account");
        
        _roles[role][tokenAddress][tokenId] = RoleInfo({
            account: account,
            expirationTime: expirationTime
        });
        
        emit RoleGranted(role, tokenAddress, tokenId, account, expirationTime);
    }
    
    /**
     * @dev Revokes a role from an NFT
     * @param role The role to revoke
     * @param tokenAddress The address of the NFT contract
     * @param tokenId The ID of the NFT
     * @param account The account that has the role
     */
    function revokeRole(
        bytes32 role,
        address tokenAddress,
        uint256 tokenId,
        address account
    ) external override onlyRole(ROLE_ADMIN) {
        require(
            _roles[role][tokenAddress][tokenId].account == account,
            "Role not granted to this account"
        );
        
        delete _roles[role][tokenAddress][tokenId];
        
        emit RoleRevoked(role, tokenAddress, tokenId, account);
    }
    
    /**
     * @dev Checks if an account has a specific role for an NFT
     * @param role The role to check
     * @param tokenAddress The address of the NFT contract
     * @param tokenId The ID of the NFT
     * @param account The account to check
     * @return Whether the account has the role and if it's not expired
     */
    function hasRole(
        bytes32 role,
        address tokenAddress,
        uint256 tokenId,
        address account
    ) external view override returns (bool) {
        RoleInfo storage roleInfo = _roles[role][tokenAddress][tokenId];
        
        // Check if the role is assigned to the account and not expired
        if (roleInfo.account != account) {
            return false;
        }
        
        // If expiration time is 0, the role never expires
        if (roleInfo.expirationTime == 0) {
            return true;
        }
        
        // Check if the role has expired
        return block.timestamp <= roleInfo.expirationTime;
    }
    
    /**
     * @dev Get the role info for a specific role, token, and token ID
     * @param role The role to check
     * @param tokenAddress The address of the NFT contract
     * @param tokenId The ID of the NFT
     * @return account The account that has the role
     * @return expirationTime When the role expires (0 for no expiration)
     */
    function getRoleInfo(
        bytes32 role,
        address tokenAddress,
        uint256 tokenId
    ) external view returns (address account, uint256 expirationTime) {
        RoleInfo storage info = _roles[role][tokenAddress][tokenId];
        return (info.account, info.expirationTime);
    }
    
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165) returns (bool) {
        return 
            interfaceId == type(IERC7432).interfaceId || 
            interfaceId == type(IERC165).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
