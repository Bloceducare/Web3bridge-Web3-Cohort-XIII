// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IErc_20 {
    function balanceOf(address _account) external view returns (uint256);
    function approve(address _spender, uint256 _amount) external returns (bool);
    function transfer(address _to, uint256 _amount) external returns (bool);
    function transferFrom(address _from, address _to, uint256 _amount) external returns (bool);
}
