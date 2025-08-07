// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface IERC20Token {
    receive() external payable;
    fallback() external;
    function transfer(address _to, uint256 _value) external;
    function approve(address _spender, uint256 _value) external;
    function transferFrom(address from, address to, uint256 value) external;
    function contractBalance() external view returns ( uint256 );
    function getbalance() external view returns ( uint256 );
    function getTokenDetails() external view returns (string memory, string memory, uint8, uint256);
}