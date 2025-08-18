// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {

    function approve(address _spender, uint amount) external;
    function balanceOf(address who) external view returns(uint balance);
    function allowance(address owner, address spender) external view returns (uint256);
}