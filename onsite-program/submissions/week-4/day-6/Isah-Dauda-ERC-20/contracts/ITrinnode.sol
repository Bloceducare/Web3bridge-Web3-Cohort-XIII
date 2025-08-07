// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface ITrinnode {

    function name() external view returns (string memory);
    function symbol() external view returns(string memory);
    function decimals() external view returns(uint8);
    function totalSupply() external view returns (uint);
    function maxSupply() external view returns (uint);
    function owner() external view returns (address);

    function balanceOf(address _account) external view returns (uint);
    function allowance(address _owner, address _spender) external view returns (uint);

    function initialize(string memory _name, string memory _symbol, uint8 _decimals, uint _initialSupply, uint _maxSupply) external ;
    function transfer(address _to, uint _amount) external returns (bool);
    function approve(address _spender, uint _amount) external returns (bool);
    function transferFrom(address _from, address _to, uint _amount) external returns (bool);
    

    function mint(address _to, uint _amount) external;
    function burn(uint _amount) external;


}