// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interface/IERC7432.sol";

contract SimpleERC7432 is IERC7432 {
    // grantor => grantee => token => tokenId => role => RoleData
    mapping(address => mapping(address => mapping(address => mapping(uint256 => mapping(bytes32 => RoleData))))) public roles;

    function grantRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantee,
        uint64 _expirationDate,
        bytes calldata _data
    ) external {
        require(_expirationDate > block.timestamp, "Expiration must be in the future");

        roles[msg.sender][_grantee][_tokenAddress][_tokenId][_role] = RoleData({
            expirationDate: _expirationDate,
            data: _data
        });

        emit RoleGranted(_role, _tokenAddress, _tokenId, _grantee, _expirationDate, _data);
    }

    function revokeRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantee
    ) external {
        delete roles[msg.sender][_grantee][_tokenAddress][_tokenId][_role];
        emit RoleRevoked(_role, _tokenAddress, _tokenId, _grantee);
    }

    function hasRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view returns (bool) {
        return roles[_grantor][_grantee][_tokenAddress][_tokenId][_role].expirationDate > block.timestamp;
    }

    function hasUniqueRole(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view returns (bool) {
        // In this simple version, unique role check is the same as hasRole
        return roles[_grantor][_grantee][_tokenAddress][_tokenId][_role].expirationDate > block.timestamp;
    }

    function roleData(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view returns (bytes memory data_) {
        return roles[_grantor][_grantee][_tokenAddress][_tokenId][_role].data;
    }

    function roleExpirationDate(
        bytes32 _role,
        address _tokenAddress,
        uint256 _tokenId,
        address _grantor,
        address _grantee
    ) external view returns (uint64 expirationDate_) {
        return roles[_grantor][_grantee][_tokenAddress][_tokenId][_role].expirationDate;
    }

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IERC7432).interfaceId;
    }
}
