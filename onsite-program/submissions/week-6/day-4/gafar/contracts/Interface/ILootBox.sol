// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface ILootBox {
  struct LootBox {
    uint256 id;
    string name;
    string description;
    uint256 price;
    uint256 maxSupply;
    uint256 currentSupply;
  }

  enum LootBoxType {
    ERC20,
    ERC721,
    ERC1155
  }
  function buyLootBox() external payable;
}
