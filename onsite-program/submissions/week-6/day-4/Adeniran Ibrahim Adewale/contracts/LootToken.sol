// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LootToken is ERC1155, Ownable {
    uint256 public constant LOOT = 0;

    constructor() ERC1155("ipfs://bafkreidw6tok7mdawb2oqiokzhyxh3oqajtptqkgocxt74dm4swjyxqory/{id}.json") Ownable(msg.sender) {}

    /// @dev only LootBox can mint
    function mint(address to, uint256 id, uint256 amount, bytes calldata data)
        external
        onlyOwner
    {
        _mint(to, id, amount, data);
    }
}