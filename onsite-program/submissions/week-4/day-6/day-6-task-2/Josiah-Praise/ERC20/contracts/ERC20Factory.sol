// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "./ERC20.sol";

contract ERC20Factory{
    ERC20 public instance;

    constructor(string memory _name, string memory _symbol, uint8 _decimals){
        instance = new ERC20(
        _name, _symbol, _decimals
        );
    }
}