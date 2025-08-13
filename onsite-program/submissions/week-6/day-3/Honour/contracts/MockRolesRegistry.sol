// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockRolesRegistry {
    struct RoleData {
        address holder;
        uint64 expiration;
    }

    // nftContract => tokenId => role => RoleData
    mapping(address => mapping(uint256 => mapping(bytes32 => RoleData))) public roles;

    function setRole(
        address nftContract,
        uint256 tokenId,
        bytes32 role,
        address holder,
        uint64 expiration
    ) public {
        roles[nftContract][tokenId][role] = RoleData(holder, expiration);
    }

    function hasRole(
        address nftContract,
        uint256 tokenId,
        bytes32 role,
        address account
    ) public view returns (bool) {
        RoleData memory data = roles[nftContract][tokenId][role];
        return (data.holder == account && data.expiration > block.timestamp);
    }
}
