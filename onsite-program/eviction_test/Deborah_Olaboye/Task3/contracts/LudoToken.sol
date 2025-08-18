// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LudoToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("Ludo", "LUDO") {
        _mint(msg.sender, initialSupply);
    }
}