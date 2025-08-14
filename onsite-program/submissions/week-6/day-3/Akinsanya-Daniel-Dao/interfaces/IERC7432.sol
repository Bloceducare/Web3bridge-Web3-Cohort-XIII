// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;
interface IERC7432{

    struct Role {
    bytes32 roleId;
    address tokenAddress;
    uint256 tokenId;
    address recipient;
    uint64 expirationDate;
    bool revocable;
    bytes data;
  }

function grantRole(Role calldata _role) external;

// function revokeRole(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external;

function ownerOf(address _tokenAddress, uint256 _tokenId) external view returns (address owner_);

}



  