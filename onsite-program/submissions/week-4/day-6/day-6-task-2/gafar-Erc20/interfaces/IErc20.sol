// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IErc20 {
  function totalSupply() external view returns(uint);
  function balanceOf(address _address) external view returns(uint);
  function transfer(address _to, uint256 amount) external returns (bool);
  function transferFrom(address _from, address _to, uint value) external returns (bool);
  function approve(address spender, uint amount) external returns(bool);
  function allowance(address owner, address spender) external view returns(uint);
}
