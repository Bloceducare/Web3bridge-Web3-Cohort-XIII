// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../interface/IERC20Standard.sol";

contract ERC20Standard is IERC20Standard {
  uint256 totalSupply_;

  mapping (address => uint256) balance;

  mapping(address => mapping(address => uint256)) set_allowance;

  address owner_;

  uint8 decimal_;
  string symbol_;
  string name_;

  
  // Set the totalsupply to the deployed contract address
  constructor(string memory _name, string memory _symbol, uint8 _decimal , uint256 _totalSupply, address _owner) {
    name_ = _name;
    symbol_ = _symbol;
    decimal_ = _decimal;
    totalSupply_ = _totalSupply;
    owner_ = _owner;

    balance[_owner] = _totalSupply;
  }

  // returns token name
  function name() external view returns(string memory) {

    return name_;

  }

  // returns token decimal
  function decimal() external view returns(uint256) {

   return decimal_;
  }

  function symbol() external view returns (string memory) {
    return symbol_;
  }


  // Allows user to transfer token to other users
  function transfer(address _to, uint256 _amount) external returns (bool) {

    require(balance[msg.sender] > _amount, "You're low on token balance");
    
    balance[msg.sender] -= _amount;

    
    balance[_to] += _amount;

    
    return true;

  }
  

  // Allows a user to give another user spending power on their behalf
  function allowance(address _owner, address _spender) external view returns (uint256) {

    _owner = msg.sender;
    
    return set_allowance[_owner][_spender];
  }

  
  // Get total supply of the minted tokens in existent
  function totalSupply() external view returns (uint256) {

    return totalSupply_;

  }


  // Get total amount of token in a particular address
  function balanceOf(address _addy) external view returns (uint256) {

    return balance[_addy];

  }


  // Allows a third party to transfer on a user behalf
  function trasferFrom(address _owner, address _receipient, uint256 _amount) external returns (bool) {

    uint256 owner_balance = this.balanceOf(_owner);
    uint256 _spender_allowance = set_allowance
    [_owner][msg.sender];

    require(owner_balance > _amount && _spender_allowance > _amount, "You don't have enough priviledge");

    balance[_owner] -= _amount;
   set_allowance[_owner][msg.sender] -= _amount;
    balance[_receipient] += _amount;

    return true;
  
  }


  // check if a specific address holds spending power
  function approve(address _spender, uint256 _amount) external returns (bool) {
    set_allowance[msg.sender][_spender] = _amount;

    return true;

  }


}
