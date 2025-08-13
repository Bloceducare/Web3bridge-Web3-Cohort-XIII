// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IERC7432.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract BasicRolesRegistry is IERC7432 {
    mapping(address => mapping(address => mapping(address => bool))) private _roleApprovals;

    struct Stored {
        address ownerAtGrant;
        address recipient;
        uint64 expiration;
        bool revocable;
        bytes data;
        bool exists;
    }

    mapping(bytes32 => Stored) private _roles;

    function _key(address tokenAddress, uint256 tokenId, bytes32 roleId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(tokenAddress, tokenId, roleId));
    }

    function ownerOf(address tokenAddress, uint256 tokenId) public view returns (address) {
        return IERC721(tokenAddress).ownerOf(tokenId);
    }

    function isRoleApprovedForAll(address tokenAddress, address owner, address operator) external view returns (bool) {
        return _roleApprovals[tokenAddress][owner][operator];
    }

    function setRoleApprovalForAll(address tokenAddress, address operator, bool approved) external {
        _roleApprovals[tokenAddress][msg.sender][operator] = approved;
        emit RoleApprovalForAll(tokenAddress, operator, approved);
    }

    function grantRole(Role calldata r) external {
        address currentOwner = ownerOf(r.tokenAddress, r.tokenId);
        require(
            msg.sender == currentOwner || _roleApprovals[r.tokenAddress][currentOwner][msg.sender],
            "Not owner/approved for roles"
        );
        require(r.recipient != address(0), "recipient=0");
        require(r.expirationDate > block.timestamp, "expired");

        bytes32 k = _key(r.tokenAddress, r.tokenId, r.roleId);
        _roles[k] = Stored({
            ownerAtGrant: currentOwner,
            recipient: r.recipient,
            expiration: r.expirationDate,
            revocable: r.revocable,
            data: r.data,
            exists: true
        });

        emit RoleGranted(
            r.tokenAddress,
            r.tokenId,
            r.roleId,
            currentOwner,
            r.recipient,
            r.expirationDate,
            r.revocable,
            r.data
        );
        emit TokenLocked(currentOwner, r.tokenAddress, r.tokenId);
    }

    function revokeRole(address tokenAddress, uint256 tokenId, bytes32 roleId) external {
        bytes32 k = _key(tokenAddress, tokenId, roleId);
        Stored memory s = _roles[k];
        require(s.exists, "no role");
        address currentOwner = ownerOf(tokenAddress, tokenId);

        if (!s.revocable) {
            require(msg.sender == s.recipient, "only recipient can revoke");
        } else {
            bool ownerOrApproved =
                msg.sender == currentOwner || _roleApprovals[tokenAddress][currentOwner][msg.sender];
            require(ownerOrApproved || msg.sender == s.recipient, "not allowed");
        }

        delete _roles[k];
        emit RoleRevoked(tokenAddress, tokenId, roleId);
    }

    function unlockToken(address tokenAddress, uint256 tokenId) external {
        address currentOwner = ownerOf(tokenAddress, tokenId);
        require(
            msg.sender == currentOwner || _roleApprovals[tokenAddress][currentOwner][msg.sender],
            "not allowed"
        );
        emit TokenUnlocked(currentOwner, tokenAddress, tokenId);
    }

    function recipientOf(address tokenAddress, uint256 tokenId, bytes32 roleId)
        external
        view
        returns (address)
    {
        return _roles[_key(tokenAddress, tokenId, roleId)].recipient;
    }

    function roleData(address tokenAddress, uint256 tokenId, bytes32 roleId)
        external
        view
        returns (bytes memory)
    {
        return _roles[_key(tokenAddress, tokenId, roleId)].data;
    }

    function roleExpirationDate(address tokenAddress, uint256 tokenId, bytes32 roleId)
        external
        view
        returns (uint64)
    {
        return _roles[_key(tokenAddress, tokenId, roleId)].expiration;
    }

    function isRoleRevocable(address tokenAddress, uint256 tokenId, bytes32 roleId)
        external
        view
        returns (bool)
    {
        return _roles[_key(tokenAddress, tokenId, roleId)].revocable;
    }
}
