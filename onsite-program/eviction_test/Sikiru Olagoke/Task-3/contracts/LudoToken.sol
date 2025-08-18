
// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.4.0
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract LudoToken is ERC20 {
    constructor()
        ERC20("LudoToken", "LDT")
      
    {
_mint(msg.sender, 20000000000);
    }

}
