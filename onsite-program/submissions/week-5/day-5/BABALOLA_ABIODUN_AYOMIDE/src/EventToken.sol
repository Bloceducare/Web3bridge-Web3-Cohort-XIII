// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract EventToken is ERC20{
    constructor(uint initialSupply) ERC20("RAFIK TOKEN", "RTK"){
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
}



