// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IERC7432.sol";
import "./interfaces/IERC165.sol";

contract RolesRegistry is IERC7432, IERC165 {
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    
    mapping(bytes32 => mapping(uint256 => mapping(address => bool))) private _roles;
    mapping(bytes32 => mapping(uint256 => address[])) private _roleMembers;
    mapping(bytes32 => mapping(uint256 => mapping(address => uint256))) private _roleMemberIndexes;
    mapping(bytes32 => bytes32) private _roleAdmins;
    
    constructor() {
        _roleAdmins[DEFAULT_ADMIN_ROLE] = DEFAULT_ADMIN_ROLE;
        _roles[DEFAULT_ADMIN_ROLE][0][msg.sender] = true;
        _roleMembers[DEFAULT_ADMIN_ROLE][0].push(msg.sender);
        _roleMemberIndexes[DEFAULT_ADMIN_ROLE][0][msg.sender] = 0;
        
        _roles[DEFAULT_ADMIN_ROLE][1][msg.sender] = true;
        _roleMembers[DEFAULT_ADMIN_ROLE][1].push(msg.sender);
        _roleMemberIndexes[DEFAULT_ADMIN_ROLE][1][msg.sender] = 0;
        
        _roles[DEFAULT_ADMIN_ROLE][2][msg.sender] = true;
        _roleMembers[DEFAULT_ADMIN_ROLE][2].push(msg.sender);
        _roleMemberIndexes[DEFAULT_ADMIN_ROLE][2][msg.sender] = 0;
        
        _roles[DEFAULT_ADMIN_ROLE][3][msg.sender] = true;
        _roleMembers[DEFAULT_ADMIN_ROLE][3].push(msg.sender);
        _roleMemberIndexes[DEFAULT_ADMIN_ROLE][3][msg.sender] = 0;
        
        _roles[DEFAULT_ADMIN_ROLE][4][msg.sender] = true;
        _roleMembers[DEFAULT_ADMIN_ROLE][4].push(msg.sender);
        _roleMemberIndexes[DEFAULT_ADMIN_ROLE][4][msg.sender] = 0;
    }
    
    function hasRole(bytes32 role, address account, uint256 tokenId) external view override returns (bool) {
        return _roles[role][tokenId][account];
    }
    
    function getRoleMemberCount(bytes32 role, uint256 tokenId) external view override returns (uint256) {
        return _roleMembers[role][tokenId].length;
    }
    
    function getRoleMember(bytes32 role, uint256 tokenId, uint256 index) external view override returns (address) {
        require(index < _roleMembers[role][tokenId].length, "Index out of bounds");
        return _roleMembers[role][tokenId][index];
    }
    
    function getRoleAdmin(bytes32 role) external view override returns (bytes32) {
        return _roleAdmins[role];
    }
    
    function grantRole(bytes32 role, address account, uint256 tokenId) external override {
        if (_roleAdmins[role] == bytes32(0)) {
            require(_roles[DEFAULT_ADMIN_ROLE][tokenId][msg.sender], "AccessControl: sender is not admin");
        } else {
            require(_roles[_roleAdmins[role]][tokenId][msg.sender] || _roles[DEFAULT_ADMIN_ROLE][tokenId][msg.sender], "AccessControl: sender is not admin");
        }
        _grantRole(role, account, tokenId);
    }
    
    function revokeRole(bytes32 role, address account, uint256 tokenId) external override {
        require(_roles[_roleAdmins[role]][tokenId][msg.sender] || _roles[DEFAULT_ADMIN_ROLE][tokenId][msg.sender], "AccessControl: sender is not admin");
        _revokeRole(role, account, tokenId);
    }
    
    function renounceRole(bytes32 role, uint256 tokenId) external override {
        _revokeRole(role, msg.sender, tokenId);
    }
    
    function _grantRole(bytes32 role, address account, uint256 tokenId) internal {
        if (!_roles[role][tokenId][account]) {
                    if (_roleAdmins[role] == bytes32(0)) {
                _roleAdmins[role] = DEFAULT_ADMIN_ROLE;
            }
            
            _roles[role][tokenId][account] = true;
            _roleMembers[role][tokenId].push(account);
            _roleMemberIndexes[role][tokenId][account] = _roleMembers[role][tokenId].length - 1;
            emit RoleGranted(role, account, tokenId, msg.sender);
        }
    }
    
    function _revokeRole(bytes32 role, address account, uint256 tokenId) internal {
        if (_roles[role][tokenId][account]) {
            _roles[role][tokenId][account] = false;
            
            uint256 lastIndex = _roleMembers[role][tokenId].length - 1;
            uint256 accountIndex = _roleMemberIndexes[role][tokenId][account];
            
            if (accountIndex != lastIndex) {
                address lastMember = _roleMembers[role][tokenId][lastIndex];
                _roleMembers[role][tokenId][accountIndex] = lastMember;
                _roleMemberIndexes[role][tokenId][lastMember] = accountIndex;
            }
            
            _roleMembers[role][tokenId].pop();
            delete _roleMemberIndexes[role][tokenId][account];
            
            emit RoleRevoked(role, account, tokenId, msg.sender);
        }
    }
    
    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IERC7432).interfaceId || interfaceId == type(IERC165).interfaceId;
    }
} 