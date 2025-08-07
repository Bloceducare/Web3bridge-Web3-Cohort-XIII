// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    event Transfer(address indexed _from, address indexed _to, uint _amount);
    event Approval(address indexed  _owner, address indexed  _spender, uint _amount);

    function mint(address _to, uint _amount) external;
    function burn(uint _amount) external;
    function _totalSupply() view external returns (uint);
    function balanceOf(address account) external view returns(uint);
    function transfer(address _to, uint _amount) external returns (bool);
    function approve(address _spender, uint _amount) external returns(bool);
    function allowance(address _owner, address _spender) external view returns (uint);
    function transferFrom(address _from, address _to, uint _amount) external returns (bool);
}