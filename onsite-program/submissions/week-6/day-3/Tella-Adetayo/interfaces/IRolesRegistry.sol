// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC7432.sol";

interface IRolesRegistry is IERC7432 {
    function hasActiveRole(
        address tokenAddress,
        uint256 tokenId,
        bytes32 roleId
    ) external view returns (bool);

    function getRoleWeight(
        address tokenAddress,
        uint256 tokenId,
        bytes32 roleId
    ) external view returns (uint256);
}