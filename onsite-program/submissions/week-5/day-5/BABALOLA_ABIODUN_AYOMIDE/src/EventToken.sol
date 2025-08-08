// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import {IERC20} from "../lib/openzeppelin-contracts/lib/erc4626-tests/ERC4626.prop.sol";

contract EventToken is IERC20{
    constructor() constructor("Event Token", ){

    }
}
