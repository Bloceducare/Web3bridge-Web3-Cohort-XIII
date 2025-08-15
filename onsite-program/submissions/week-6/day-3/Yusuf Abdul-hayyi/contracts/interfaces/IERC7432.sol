//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";

interface IERC7432 is IERC165 {
    struct Role {
        bytes32 roleId;
        address tokenAddress;
        uint256 tokenId;
        address recipient;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }
    event RoleRevoked(address indexed _tokenAddress, uint256 indexed _tokenId, bytes32 indexed _roleId);
    event RoleApprovalForAll(address indexed _tokenAddress, address indexed _operator, bool indexed _isApproved);

    /* Writes */
    function grantRole(Role calldata _role) external;
    function revokeRole(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external;
    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _approved) external;

    /* Views */
    function recipientOf(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external view returns (address);
    function roleExpirationDate(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external view returns (uint64);
}