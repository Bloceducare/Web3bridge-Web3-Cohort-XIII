// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/interfaces/IERC165.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "../libraries/Storage.sol";

contract ERC7432RoleRegistry is IERC165 {

    mapping(address => mapping(uint256 => mapping(bytes32 => Storage.Role))) private _roles;
    mapping(address => mapping(address => mapping(address => bool))) private _roleApprovalForAll;

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IERC165).interfaceId || interfaceId == 0xd00ca5cf;
    }


    function grantRole(Storage.Role memory _role) external {
        if (_role.tokenAddress == address(0)) {
            revert Storage.Invalid_token_address();
        } else if (_role.recipient == address(0)) {
            revert Storage.Invalid_token_address();
        } else if (_role.expirationDate > block.timestamp) {
            revert Storage.Invalid_expiration_date();
        } else {

            IERC721 tokenContract = IERC721(_role.tokenAddress);

            address owner = tokenContract.ownerOf(_role.tokenId);

            if (msg.sender == owner || _roleApprovalForAll[_role.tokenAddress][owner][msg.sender]) {
                revert Storage.Not_authorized();
            }

            _roles[_role.tokenAddress][_role.tokenId][_role.roleId] = _role;

            emit Storage.RoleGranted(_role.tokenAddress, owner, _role.recipient, _role.expirationDate, _role.revocable);
        }
    }

    function revokeRole(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external {

        Storage.Role storage role = _roles[_tokenAddress][_tokenId][_roleId];

        if (role.recipient == address(0)) {
            revert Storage.Role_does_not_exist();
        }

        if (role.revocable) {
            revert Storage.Role_is_not_revocable();
        }

        IERC721 tokenContract = IERC721(_tokenAddress);

        address owner = tokenContract.ownerOf(_tokenId);

        if (msg.sender != owner || _roleApprovalForAll[_tokenAddress][owner][msg.sender]) {
            revert Storage.Not_authorized();
        }

        delete _roles[_tokenAddress][_tokenId][_roleId];

        emit Storage.RoleRevoked(_tokenAddress, _tokenId, _roleId);
    }

    function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _approved) external {

        _roleApprovalForAll[_tokenAddress][msg.sender][_operator] = _approved;

        emit Storage.RoleApprovalForAll(_tokenAddress, _operator, _approved);
    }

    function recipientOf( address _tokenAddress, uint256 _tokenId, bytes32 _roleId ) external view returns (address) {
        return _roles[_tokenAddress][_tokenId][_roleId].recipient;
    }

    function roleExpirationDate( address _tokenAddress, uint256 _tokenId, bytes32 _roleId ) external view returns (uint64) {
        return _roles[_tokenAddress][_tokenId][_roleId].expirationDate;
    }

    function isRoleRevocable( address _tokenAddress, uint256 _tokenId, bytes32 _roleId ) external view returns (bool) {
        return _roles[_tokenAddress][_tokenId][_roleId].revocable;
    }

    function roleData( address _tokenAddress, uint256 _tokenId, bytes32 _roleId ) external view returns (bytes memory) {
        return _roles[_tokenAddress][_tokenId][_roleId].data;
    }

    function isRoleApprovedForAll( address _tokenAddress, address _owner, address _operator ) external view returns (bool) {
        return _roleApprovalForAll[_tokenAddress][_owner][_operator];
    }
}