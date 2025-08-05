// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAMAS {
    function totalsupply() external view returns (uint);
    function balanceOf(address _owner) external view returns (uint balance);
    function allowance(address owner, address spender) external view returns (uint256);
    function transfer(address _to, uint256 _value) external returns (bool success);
    function approve(address _spender, uint256 _value) external returns (bool success);
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success);

//     event Transfer(address indexed from, address indexed to, uint256 value);
//     event Approval(address indexed owner, address indexed spender, uint256 value);
 }