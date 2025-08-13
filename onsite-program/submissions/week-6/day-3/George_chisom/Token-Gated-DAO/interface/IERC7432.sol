// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/interfaces/IERC165.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "../libraries/Storage.sol";


interface IERC7432 {

    function grantRole(Storage.Role calldata _role) external;

    function revokeRole(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external;

    function recipientOf(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external view returns (address);

    function roleExpirationDate(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external view returns (uint64);

    function isRoleRevocable(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external view returns (bool);

    function roleData(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external view returns (bytes memory);
}