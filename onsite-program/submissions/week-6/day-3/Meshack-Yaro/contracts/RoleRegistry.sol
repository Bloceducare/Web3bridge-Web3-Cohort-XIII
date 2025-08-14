// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC7432} from "./interfaces/IERC7432.sol";

contract RoleRegistry is IERC7432 {

    // Mapping: roleId => nftContract => tokenId => recipient => RoleData
    mapping(bytes32 => mapping(address => mapping(uint256 => mapping(address => RoleData)))) private _roles;

    // Track total tokens per address for role queries
    mapping(address => mapping(address => uint256[])) private _tokensWithRoles;

    modifier onlyNFTOwner(address nftContract, uint256 tokenId) {
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not NFT owner");
        _;
    }

    function grantRole(
        bytes32 roleId,
        address nftContract,
        uint256 tokenId,
        address recipient,
        uint64 expiration,
        bool revocable,
        bytes calldata data
    ) external override onlyNFTOwner(nftContract, tokenId) {
        require(recipient != address(0), "Invalid recipient");
        require(expiration > block.timestamp, "Invalid expiration");

        _roles[roleId][nftContract][tokenId][recipient] = RoleData({
            recipient: recipient,
            issuance: uint64(block.timestamp),
            expiration: expiration,
            data: data,
            revocable: revocable
        });
        _tokensWithRoles[nftContract][recipient].push(tokenId);

        emit RoleGranted(roleId, nftContract, tokenId, recipient);
    }

    function revokeRole(
        bytes32 roleId,
        address nftContract,
        uint256 tokenId,
        address recipient
    ) external override onlyNFTOwner(nftContract, tokenId) {
        RoleData memory role = _roles[roleId][nftContract][tokenId][recipient];
        require(role.recipient != address(0), "Role not assigned");
        require(role.revocable, "Role not revocable");

        delete _roles[roleId][nftContract][tokenId][recipient];
        emit RoleRevoked(roleId, nftContract, tokenId, recipient);
    }

    function recipientOf(
        bytes32 roleId,
        address nftContract,
        uint256 tokenId
    ) external view override returns (address, uint64, uint64, bytes memory, bool) {
        RoleData memory role = _roles[roleId][nftContract][tokenId][msg.sender];
        if (role.recipient != address(0) && (role.expiration == 0 || role.expiration > block.timestamp)) {
            return (role.recipient, role.issuance, role.expiration, role.data, role.revocable);
        }
        return (address(0), 0, 0, "", false);
    }

    // New: Get all tokenIds with a role for an address
    function getTokensWithRole(address nftContract, address account, bytes32 roleId)
        external
        view
        returns (uint256[] memory tokenIds, uint256[] memory weights)
    {
        uint256[] memory tokens = _tokensWithRoles[nftContract][account];
        uint256 validCount = 0;
        for (uint256 i = 0; i < tokens.length; i++) {
            if (_roles[roleId][nftContract][tokens[i]][account].recipient != address(0) &&
                (_roles[roleId][nftContract][tokens[i]][account].expiration == 0 ||
                 _roles[roleId][nftContract][tokens[i]][account].expiration > block.timestamp)) {
                validCount++;
            }
        }

        tokenIds = new uint256[](validCount);
        weights = new uint256[](validCount);
        uint256 index = 0;
        for (uint256 i = 0; i < tokens.length; i++) {
            RoleData memory role = _roles[roleId][nftContract][tokens[i]][account];
            if (role.recipient != address(0) && (role.expiration == 0 || role.expiration > block.timestamp)) {
                tokenIds[index] = tokens[i];
                weights[index] = role.data.length > 0 ? abi.decode(role.data, (uint256)) : 1;
                index++;
            }
        }
        return (tokenIds, weights);
    }
}