// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../interfaces/IERC7432.sol";

error ROLE_EXPIRED();
error ROLE_ALREADY_GRANTED_FOR_TOKEN();

contract ERC7432 is IERC7432 {
    bytes32 public constant DAO_ADMIN_ROLE = keccak256("DAO_ADMIN");
    bytes32 public constant DAO_MEMBER_ROLE = keccak256("DAO_MEMBER");
    bytes32 public constant DAO_VOTER_ROLE = keccak256("DAO_VOTER");
    mapping(address => mapping(uint256 => address)) originalOwner; 
    mapping(address => mapping(uint256 => mapping(bytes32 => address))) roleToRecipient;
    mapping(address => mapping(uint256 => mapping(bytes32 => uint256))) roleExpiration;

    function grantRole(Role calldata _role) external {
        address tokenAddress = _role.tokenAddress;
        uint256 tokenId = _role.tokenId;
        address owner = this.ownerOf(tokenAddress, tokenId); 
        if (owner == address(0)) {
            originalOwner[tokenAddress][tokenId] = msg.sender;
            owner = msg.sender;
        }

        require(_role.expirationDate > block.timestamp, ROLE_EXPIRED()); 
        require(roleToRecipient[tokenAddress][tokenId][_role.roleId] == address(0), ROLE_ALREADY_GRANTED_FOR_TOKEN());


        roleToRecipient[tokenAddress][tokenId][_role.roleId] = _role.recipient;
        roleExpiration[tokenAddress][tokenId][_role.roleId] = _role.expirationDate;
    }

    function ownerOf(address _tokenAddress, uint256 _tokenId) external view returns (address owner_) {
        return originalOwner[_tokenAddress][_tokenId];
    }

    function recipientOf(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external view returns (address) {
        if (roleExpiration[_tokenAddress][_tokenId][_roleId] > block.timestamp) {
            return roleToRecipient[_tokenAddress][_tokenId][_roleId];
        }
        return address(0);
    }
}