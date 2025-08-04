// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20{
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function totalSupply() external view returns (uint256);
    function balanceOf(address _owner) external view returns (uint256);
    function approve(address _spender, uint256 _value) external returns (bool);
    // function decimals() external view returns (uint8);

    function transfer(address _to, uint256 _value) external returns (bool);
    function transferFrom(address _from, address _to, uint _value) external returns (bool);
    function allowance(address _owner, address _spender) external  returns (uint);
}