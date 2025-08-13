// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC7432 {
    struct Role {
        bytes32 roleId;
        address tokenAddress;
        uint256 tokenId;
        address recipient;
        uint256 expirationDate;
        bool revocable;
        bool active;
    }

    /// @notice Assign a role to a recipient based on NFT ownership
    function assignRole(
        bytes32 roleId,
        uint256 tokenId,
        address recipient,
        uint256 expirationDate,
        bool revocable
    ) external;

    /// @notice Revoke a previously assigned role
    function revokeRole(bytes32 roleId) external;

    /// @notice Check if a user currently holds a valid role
    function hasRole(address user, bytes32 roleId) external view returns (bool);

    /// @notice Get all role IDs assigned to a user
    function getRoles(address user) external view returns (bytes32[] memory);

    /// @notice Get full role data by role ID
    function getRoleData(bytes32 roleId) external view returns (Role memory);
}

contract RoleNFT is ERC721, Ownable, IERC7432 {
    uint256 private _tokenIdCounter;
    
    mapping(bytes32 => Role) private _roles;
    mapping(address => bytes32) private _userRole; // Single role per user

    event RoleGranted(
        bytes32 indexed roleId,
        address indexed recipient,
        uint256 indexed tokenId,
        uint256 expirationDate
    );
    
    event RoleRevoked(
        bytes32 indexed roleId,
        address indexed recipient
    );

    error InvalidRecipient();
    error ExpirationInPast();
    error RoleNotActive();
    error RoleNotRevocable();
    error NotTokenOwner();
    error UserAlreadyHasRole();

    constructor(address initialOwner) 
        ERC721("RoleNFT", "RNFT") 
        Ownable(initialOwner) 
    {}

    function mint(address to) external onlyOwner {
        if (to == address(0)) revert InvalidRecipient();
        
        uint256 tokenId = ++_tokenIdCounter;
        _mint(to, tokenId);
    }

    function assignRole(
        bytes32 roleId,
        uint256 tokenId,
        address recipient,
        uint256 expirationDate,
        bool revocable
    ) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (recipient == address(0)) revert InvalidRecipient();
        if (expirationDate <= block.timestamp) revert ExpirationInPast();
        if (_roles[roleId].active) revert UserAlreadyHasRole();
        
        // Check if user already has an active role
        bytes32 existingRoleId = _userRole[recipient];
        if (existingRoleId != 0 && _roles[existingRoleId].active && 
            block.timestamp < _roles[existingRoleId].expirationDate) {
            revert UserAlreadyHasRole();
        }

        _roles[roleId] = Role(
            roleId,
            address(this),
            tokenId,
            recipient,
            expirationDate,
            revocable,
            true
        );

        _userRole[recipient] = roleId;

        emit RoleGranted(roleId, recipient, tokenId, expirationDate);
    }

    function revokeRole(bytes32 roleId) external {
        Role storage role = _roles[roleId];
        
        if (!role.active) revert RoleNotActive();
        if (!role.revocable) revert RoleNotRevocable();
        if (ownerOf(role.tokenId) != msg.sender) revert NotTokenOwner();

        role.active = false;
        
        // Clear user's role mapping
        if (_userRole[role.recipient] == roleId) {
            delete _userRole[role.recipient];
        }

        emit RoleRevoked(roleId, role.recipient);
    }

    function hasRole(address user, bytes32 roleId) external view returns (bool) {
        Role storage role = _roles[roleId];
        return role.recipient == user && 
               role.active && 
               block.timestamp < role.expirationDate;
    }

    function getRoles(address user) external view returns (bytes32[] memory) {
        bytes32 roleId = _userRole[user];
        if (roleId == 0) {
            return new bytes32[](0); // Return empty array
        }
        
        bytes32[] memory result = new bytes32[](1);
        result[0] = roleId;
        return result;
    }

    function getRoleData(bytes32 roleId) external view returns (Role memory) {
        return _roles[roleId];
    }
}
