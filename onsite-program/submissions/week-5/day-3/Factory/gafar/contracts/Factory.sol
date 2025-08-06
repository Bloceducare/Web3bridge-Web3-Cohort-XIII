// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "./Erc20.sol";


contract Factory {
  Erc20[] public tokenStandards;

  function createNewToken(string memory name_, string memory symbol_, uint8 decimals_, uint256 initialSupply) external {
    Erc20 token = new Erc20(name_, symbol_, decimals_, initialSupply);
    tokenStandards.push(token);
  }

  function getName(uint256 _tokenIndex) external view returns (string memory) {
    return Erc20(address(tokenStandards[_tokenIndex])).name();
  }

  function getSymbol(uint256 _tokenIndex) external view returns (string memory) {
    return Erc20(address(tokenStandards[_tokenIndex])).symbol();
  }

  function getDecimal(uint256 _tokenIndex) external view returns (uint8) {
    return Erc20(address(tokenStandards[_tokenIndex])).decimals();
  }

  function getTotalSupply(uint256 _tokenIndex) external view returns (uint256) {
    return Erc20(address(tokenStandards[_tokenIndex])).totalSupply();
  }

  function getBalanceOf(uint256 _tokenIndex, address account) external view returns (uint256) {
    return Erc20(address(tokenStandards[_tokenIndex])).balanceOf(account);
  }

  function transferFunc(uint256 _tokenIndex, address recipient, uint256 amount) external returns (bool) {
    return Erc20(address(tokenStandards[_tokenIndex])).transfer(recipient, amount);
  }

  function approveFunc(uint256 _tokenIndex, address spender, uint256 amount) external returns (bool) {
    return Erc20(address(tokenStandards[_tokenIndex])).approve(spender, amount);
  }

  function transferFromFunc(uint256 _tokenIndex, address sender, address recipient, uint256 amount) external returns (bool) {
    return Erc20(address(tokenStandards[_tokenIndex])).transferFrom(sender, recipient, amount);
  }

  function allowanceFunc(uint256 _tokenIndex, address _owner, address _spender) view external returns (uint256) {
    return Erc20(address(tokenStandards[_tokenIndex])).allowance(_owner, _spender);
  }

  function mintFunc(uint256 _tokenIndex, address to, uint256 amount) external {
    return Erc20(address(tokenStandards[_tokenIndex]))._mint(to, amount);
  }

  function burnFunc(uint256 _tokenIndex, address from, uint256 amount) external {
    return Erc20(address(tokenStandards[_tokenIndex]))._burn(from, amount);
  }
}
