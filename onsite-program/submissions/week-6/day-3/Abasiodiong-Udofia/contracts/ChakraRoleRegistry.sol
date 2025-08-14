// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract ChakraRoleRegistry {
    struct RoleAssignment {
        address grantor;
        address recipient;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }


    mapping(address => mapping(uint256 => mapping(bytes32 => RoleAssignment))) private _roleAssignments;
    mapping(address => mapping(address => mapping(address => bool))) private _roleApprovalForAll;

    event RoleGranted(
        address indexed tokenAddress,
        uint256 indexed tokenId,
        bytes32 indexed roleId,
        address grantor,
        address recipient,
        uint64 expirationDate,
        bool revocable,
        bytes data
    );
    event RoleRevoked(address indexed tokenAddress, uint256 indexed tokenId, bytes32 indexed roleId);
    event RoleApprovalForAll(address indexed tokenAddress, address indexed operator, address indexed owner, bool approved);

    function grantRole(
        address tokenAddress,
        uint256 tokenId,
        bytes32 roleId,
        address recipient,
        uint64 expirationDate,
        bool revocable,
        bytes calldata data
    ) external {
        require(expirationDate > block.timestamp, "Expiration date must be in the future");
        require(recipient != address(0), "Recipient cannot be zero address");

        address owner = IERC721(tokenAddress).ownerOf(tokenId);
        require(msg.sender == owner || _roleApprovalForAll[tokenAddress][owner][msg.sender], "Caller not authorized");

        _roleAssignments[tokenAddress][tokenId][roleId] = RoleAssignment({
            grantor: msg.sender,
            recipient: recipient,
            expirationDate: expirationDate,
            revocable: revocable,
            data: data
        });

        emit RoleGranted(tokenAddress, tokenId, roleId, msg.sender, recipient, expirationDate, revocable, data);
    }

    function revokeRole(address tokenAddress, uint256 tokenId, bytes32 roleId) external {
        RoleAssignment storage assignment = _roleAssignments[tokenAddress][tokenId][roleId];
        require(assignment.recipient != address(0), "Role not assigned");
        require(assignment.revocable, "Role is not revocable");

        address owner = IERC721(tokenAddress).ownerOf(tokenId);
        require(msg.sender == owner || msg.sender == assignment.grantor || _roleApprovalForAll[tokenAddress][owner][msg.sender], "Caller not authorized");

        delete _roleAssignments[tokenAddress][tokenId][roleId];
        emit RoleRevoked(tokenAddress, tokenId, roleId);
    }

    function setRoleApprovalForAll(address tokenAddress, address operator, bool approved) external {
        _roleApprovalForAll[tokenAddress][msg.sender][operator] = approved;
        emit RoleApprovalForAll(tokenAddress, msg.sender, operator, approved);
    }

    function recipientOf(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (address) {
        RoleAssignment memory assignment = _roleAssignments[tokenAddress][tokenId][roleId];
        if (assignment.recipient == address(0) || assignment.expirationDate <= block.timestamp) {
            return address(0);
        }
        return assignment.recipient;
    }

    function roleData(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (bytes memory) {
        RoleAssignment memory assignment = _roleAssignments[tokenAddress][tokenId][roleId];
        if (assignment.recipient == address(0) || assignment.expirationDate <= block.timestamp) {
            return "";
        }
        return assignment.data;
    }

    function roleExpirationDate(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (uint64) {
        return _roleAssignments[tokenAddress][tokenId][roleId].expirationDate;
    }

    function isRoleRevocable(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (bool) {
        return _roleAssignments[tokenAddress][tokenId][roleId].revocable;
    }

    function isRoleApprovedForAll(address tokenAddress, address owner, address operator) external view returns (bool) {
        return _roleApprovalForAll[tokenAddress][owner][operator];
    }

    function ownerOf(address tokenAddress, uint256 tokenId) external view returns (address) {
        return IERC721(tokenAddress).ownerOf(tokenId);
    }

}
