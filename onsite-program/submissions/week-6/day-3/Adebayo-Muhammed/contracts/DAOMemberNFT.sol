// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC7432.sol";


contract DAOMemberNFT is ERC721, IERC7432, Ownable {
    struct RoleData {
        address user;
        uint64 expirationDate;
    }

    mapping(uint256 => mapping(bytes32 => mapping(address => RoleData))) private _roles;
    
    event RoleGranted(uint256 indexed tokenId, bytes32 indexed role, address indexed user, uint64 expirationDate);
    event RoleRevoked(uint256 indexed tokenId, bytes32 indexed role, address indexed user);
    
    constructor() ERC721("DAO Member NFT", "DMEMBER") Ownable(msg.sender) {}
    
   
    function mint(address to, uint256 tokenId) external onlyOwner {
        _safeMint(to, tokenId);
    }
 
    function hasRole(uint256 tokenId, bytes32 role, address user) 
        external view override returns (bool) {
        RoleData memory roleData = _roles[tokenId][role][user];
        return roleData.user == user && 
               (roleData.expirationDate == 0 || roleData.expirationDate > block.timestamp);
    }
    
   
    function grantRole(uint256 tokenId, bytes32 role, address user, uint64 expirationDate) 
        external override {
        require(_isAuthorized(ownerOf(tokenId), msg.sender, tokenId), "Not authorized");
        
        _roles[tokenId][role][user] = RoleData(user, expirationDate);
        emit RoleGranted(tokenId, role, user, expirationDate);
    }
    
    function revokeRole(uint256 tokenId, bytes32 role, address user) 
        external override {
        require(_isAuthorized(ownerOf(tokenId), msg.sender, tokenId), "Not authorized");
        
        delete _roles[tokenId][role][user];
        emit RoleRevoked(tokenId, role, user);
    }
}