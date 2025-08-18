// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20Permit {
    function name() external view returns (string memory);

    function nonces(address owner) external view returns (uint256);

    function DOMAIN_SEPARATOR() external view returns (bytes32);

    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function balanceOf(address account) external view returns (uint256);

    function approve(address spender, uint256 value) external returns (bool);

    function totalSupply() external view returns (uint256);
}
