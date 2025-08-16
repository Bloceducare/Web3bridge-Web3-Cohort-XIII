// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./interfaces/IERC7432.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Roles is IERC7432 {
    address public immutable roleNftContract;

    // role => tokenAddress => tokenId => grantor => grantee => RoleData
    mapping(bytes32 => mapping(address => mapping(uint256 => mapping(address => mapping(address => RoleData))))) private _roleAssignments;

    constructor(address _roleNftContract) {
        roleNftContract = _roleNftContract;
    }

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IERC7432).interfaceId || interfaceId == type(IERC165).interfaceId;
    }

    function grantRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantee,
        uint64 _expirationDate,
        bytes calldata _data
    ) external override {
        if (_tokenAddress != roleNftContract || msg.sender != IERC721(_tokenAddress).ownerOf(_tokenId)) {
            revert("Only NFT owner can grant role");
        }
        _roleAssignments[_role][_tokenAddress][_tokenId][msg.sender][_grantee] = RoleData(_expirationDate, _data);
        emit RoleGranted(_role, _tokenAddress, _tokenId, _grantee, _expirationDate, _data);
    }

    function revokeRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantee
    ) external override {
        if (_tokenAddress != roleNftContract || msg.sender != IERC721(_tokenAddress).ownerOf(_tokenId)) {
            revert("Only NFT owner can revoke role");
        }
        delete _roleAssignments[_role][_tokenAddress][_tokenId][msg.sender][_grantee];
        emit RoleRevoked(_role, _tokenAddress, _tokenId, _grantee);
    }

    function hasRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view override returns (bool) {
        return _roleAssignments[_role][_tokenAddress][_tokenId][_grantor][_grantee].expirationDate > block.timestamp;
    }

    function hasUniqueRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view override returns (bool) {
        return this.hasRole(_role, _tokenAddress, _tokenId, _grantor, _grantee);
    }

    function roleData(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view override returns (bytes memory) {
        return _roleAssignments[_role][_tokenAddress][_tokenId][_grantor][_grantee].data;
    }

    function roleExpirationDate(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view override returns (uint64) {
        return _roleAssignments[_role][_tokenAddress][_tokenId][_grantor][_grantee].expirationDate;
    }

    function checkRole(address _userAddress) external view override returns (Permissions) {
        bytes32 votingRole = keccak256("VOTER");
        bytes32 proposerRole = keccak256("PROPOSER");
        bytes32 daoRole = keccak256("DAO_MEMBER");
        uint256 tokenId = 0; // Assume tokenId 0 for simplicity; adjust for multi-token

        if (this.hasRole(daoRole, roleNftContract, tokenId, _userAddress, _userAddress)) {
            return Permissions.DAO_RIGHTS;
        }
        if (this.hasRole(proposerRole, roleNftContract, tokenId, _userAddress, _userAddress)) {
            return Permissions.PROPOSAL_RIGHTS;
        }
        if (this.hasRole(votingRole, roleNftContract, tokenId, _userAddress, _userAddress)) {
            return Permissions.VOTING_RIGHTS;
        }
        return Permissions.NO_RIGHTS;
    }
}