// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardERC20 is ERC20, Ownable {
  uint256 public constant TOTAL_SUPPLY = 1_000_000 * 10**18; // 1M tokens

  constructor() ERC20("LootToken", "LT") Ownable(msg.sender) {
    _mint(address(this), TOTAL_SUPPLY);
  }

  function transferToWinner(address to, uint256 amount) external onlyOwner {
      require(balanceOf(address(this)) >= amount, "Insufficient contract balance");
      _transfer(address(this), to, amount);
  }
}
