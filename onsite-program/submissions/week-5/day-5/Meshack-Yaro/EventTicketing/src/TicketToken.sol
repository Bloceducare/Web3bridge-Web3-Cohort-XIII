// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20} from "@openzeppelin/contracts/access/Ownable.sol";

contract TicketToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("Ticket", "TKT") {
        _mint(msg.sender, initialSupply);
    }
}
