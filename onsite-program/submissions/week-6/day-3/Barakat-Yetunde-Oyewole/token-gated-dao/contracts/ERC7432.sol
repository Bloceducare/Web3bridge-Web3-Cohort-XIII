// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IERC7432.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";


abstract contract ERC7432 is IERC7432, ERC165 {
    struct RoleData {
        uint64 expirationDate;
        bytes data;
    }

    
    mapping(bytes32 => mapping(uint256 => mapping(address => RoleData))) private _roleData;
    
   
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    modifier onlyTokenOwnerOrApproved(uint256 tokenId) {
        address owner = _ownerOf(tokenId);
        require(
            msg.sender == owner || 
            _isApproved(owner, msg.sender) || 
            isRoleApprovedForAll(owner, msg.sender),
            "ERC7432: caller is not owner nor approved"
        );
        _;
    }

    
    function grantRole(
        bytes32 role,
        uint256 tokenId,
        address account,
        uint64 expirationDate,
        bytes calldata data
    ) external override onlyTokenOwnerOrApproved(tokenId) {
        require(account != address(0), "ERC7432: grant role to zero address");
        require(_exists(tokenId), "ERC7432: role grant for nonexistent token");
        
        _roleData[role][tokenId][account] = RoleData(expirationDate, data);
        
        emit RoleGranted(role, tokenId, account, expirationDate, data);
    }

    
    function revokeRole(
        bytes32 role,
        uint256 tokenId,
        address account
    ) external override onlyTokenOwnerOrApproved(tokenId) {
        require(_exists(tokenId), "ERC7432: role revoke for nonexistent token");
        
        delete _roleData[role][tokenId][account];
        
        emit RoleRevoked(role, tokenId, account);
    }

   
    function hasRole(
        bytes32 role,
        uint256 tokenId,
        address account
    ) external view override returns (bool) {
        if (!_exists(tokenId)) return false;
        
        RoleData storage data = _roleData[role][tokenId][account];
        
        
        if (data.expirationDate == 0 && data.data.length == 0) return false;
        
        
        return (data.expirationDate == 0 || data.expirationDate == type(uint64).max) || data.expirationDate > block.timestamp;
    }

    
    function roleExpirationDate(
        bytes32 role,
        uint256 tokenId,
        address account
    ) external view override returns (uint64) {
        if (!_exists(tokenId)) return 0;
        return _roleData[role][tokenId][account].expirationDate;
    }

    
    function roleData(
        bytes32 role,
        uint256 tokenId,
        address account
    ) external view override returns (bytes memory) {
        if (!_exists(tokenId)) return "";
        return _roleData[role][tokenId][account].data;
    }

    
    function setRoleApprovalForAll(address operator, bool approved) external override {
        require(operator != msg.sender, "ERC7432: approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit RoleApprovalForAll(msg.sender, operator, approved);
    }

    
    function isRoleApprovedForAll(address owner, address operator) public view override returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC7432).interfaceId || super.supportsInterface(interfaceId);
    }

    
    function _grantRole(
        bytes32 role,
        uint256 tokenId,
        address account,
        uint64 expirationDate,
        bytes memory data
    ) internal {
        require(account != address(0), "ERC7432: grant role to zero address");
        require(_exists(tokenId), "ERC7432: role grant for nonexistent token");
        
        
        uint64 actualExpiration;
        if (expirationDate == 0 && data.length == 0) {
            actualExpiration = type(uint64).max; 
        } else {
            actualExpiration = expirationDate;
        }
        
        _roleData[role][tokenId][account] = RoleData(actualExpiration, data);
        
        emit RoleGranted(role, tokenId, account, actualExpiration, data);
    }

    
    function _ownerOf(uint256 tokenId) internal view virtual returns (address);
    function _exists(uint256 tokenId) internal view virtual returns (bool);
    function _isApproved(address owner, address operator) internal view virtual returns (bool);
}
