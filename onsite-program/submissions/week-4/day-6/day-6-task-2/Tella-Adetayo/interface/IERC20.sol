// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IERC20 {
    function totalSupply() external view returns (uint); 
    function balanceOf(address _account) external view returns (uint); 
    function transfer(address _recipient, uint _amount) external returns (bool); 
    function allowance(address _owner, address _spender) external view returns (uint); 
    function approve(address _sender, uint _amount) external returns (bool); 
    function transferFrom(address _sender, address _recipient, uint _amount) external returns (bool);

    event Transfer(address indexed _to, address indexed _from, uint _amount); 
    event Approval(address indexed _sender, address indexed _recipient, uint _amount); 
}