// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/EIP-7432.sol";

contract EIP7432Mock is IERC7432 {
    mapping(address => mapping(uint256 => mapping(bytes32 => uint64))) private _expiry;

    function grantRole(Role calldata _role) external override {
        _expiry[_role.tokenAddress][_role.tokenId][_role.roleId] = _role.expirationDate;
    }

    function revokeRole(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external override {
        delete _expiry[_tokenAddress][_tokenId][_roleId];
    }

    function ownerOf(address, uint256) external pure override returns (address owner_) {
        return address(0x1234);
    }

    function roleData(address, uint256, bytes32) external pure override returns (bytes memory data_) {
        return "";
    }

    function roleExpirationDate(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external view override returns (uint64) {
        return _expiry[_tokenAddress][_tokenId][_roleId];
    }
}
