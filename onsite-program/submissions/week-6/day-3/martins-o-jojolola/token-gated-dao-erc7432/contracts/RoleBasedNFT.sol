// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC7432.sol";


contract RoleBasedNFT is ERC721, Ownable, IERC7432 {
    mapping(bytes32 => mapping(uint256 => mapping(address => RoleData))) private _roleAssignments;
    
    uint256 private _tokenIdCounter;
    
    bytes32 public constant DAO_MEMBER_ROLE = keccak256("DAO_MEMBER");
    bytes32 public constant DAO_ADMIN_ROLE = keccak256("DAO_ADMIN");
    bytes32 public constant PROPOSAL_CREATOR_ROLE = keccak256("PROPOSAL_CREATOR");
    bytes32 public constant VOTER_ROLE = keccak256("VOTER");

    constructor(string memory name, string memory symbol) ERC721(name, symbol) Ownable(msg.sender) {}

    function mint(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _mint(to, tokenId);
        return tokenId;
    }

    function grantRole(
        bytes32 _role,
        uint256 _tokenId,
        address _account,
        uint64 _expirationDate,
        bool _revocable,
        bytes calldata _data
    ) external override {
        require(_exists(_tokenId), "RoleBasedNFT: Token does not exist");
        require(
            msg.sender == ownerOf(_tokenId) || msg.sender == owner(),
            "RoleBasedNFT: Not authorized to grant role"
        );

        _roleAssignments[_role][_tokenId][_account] = RoleData({
            recipient: _account,
            expirationDate: _expirationDate,
            revocable: _revocable,
            data: _data
        });

        emit RoleGranted(_role, _tokenId, _account, _expirationDate, _revocable, _data);
    }

    function revokeRole(bytes32 _role, uint256 _tokenId, address _account) external override {
        require(_exists(_tokenId), "RoleBasedNFT: Token does not exist");
        
        RoleData memory roleInfo = _roleAssignments[_role][_tokenId][_account];
        require(roleInfo.recipient != address(0), "RoleBasedNFT: Role not assigned");
        require(roleInfo.revocable, "RoleBasedNFT: Role not revocable");
        require(
            msg.sender == ownerOf(_tokenId) || msg.sender == owner(),
            "RoleBasedNFT: Not authorized to revoke role"
        );

        delete _roleAssignments[_role][_tokenId][_account];
        emit RoleRevoked(_role, _tokenId, _account);
    }

    function hasRole(bytes32 _role, uint256 _tokenId, address _account) external view override returns (bool) {
        if (!_exists(_tokenId)) return false;
        
        RoleData memory roleInfo = _roleAssignments[_role][_tokenId][_account];
        if (roleInfo.recipient == address(0)) return false;
        
        if (roleInfo.expirationDate != 0 && block.timestamp > roleInfo.expirationDate) {
            return false;
        }
        
        return true;
    }

    function roleData(bytes32 _role, uint256 _tokenId, address _account) external view override returns (RoleData memory) {
        require(_exists(_tokenId), "RoleBasedNFT: Token does not exist");
        return _roleAssignments[_role][_tokenId][_account];
    }

    function roleExpirationDate(bytes32 _role, uint256 _tokenId, address _account) external view override returns (uint64) {
        require(_exists(_tokenId), "RoleBasedNFT: Token does not exist");
        return _roleAssignments[_role][_tokenId][_account].expirationDate;
    }

    function isRoleRevocable(bytes32 _role, uint256 _tokenId, address _account) external view override returns (bool) {
        require(_exists(_tokenId), "RoleBasedNFT: Token does not exist");
        return _roleAssignments[_role][_tokenId][_account].revocable;
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }


    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId < _tokenIdCounter && _ownerOf(tokenId) != address(0);
    }
}
