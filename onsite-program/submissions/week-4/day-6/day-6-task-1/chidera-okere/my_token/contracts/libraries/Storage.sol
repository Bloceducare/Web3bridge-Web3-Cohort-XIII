//SPDX-License-Identifier: MIT


pragma solidity ^0.8.28;

library Storage {

   struct Token {
      string name;
      string symbol;
      uint256 decimal;
      uint256 totalSupply;
      address owner;

   }

   error InsufficientBalance();
    error InsufficientAllowance();
    error ZeroAddress();
    error NotOwner();

}