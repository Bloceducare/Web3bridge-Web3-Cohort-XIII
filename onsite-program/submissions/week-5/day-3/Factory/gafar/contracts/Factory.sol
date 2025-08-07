// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "./Erc20.sol";


contract Factory {
  Erc20[] public tokenStandards;

  function createNewToken(string memory name_, string memory symbol_, uint8 decimals_, uint256 initialSupply) external {
    Erc20 token = new Erc20(name_, symbol_, decimals_, initialSupply);
    tokenStandards.push(token);
  }
}
