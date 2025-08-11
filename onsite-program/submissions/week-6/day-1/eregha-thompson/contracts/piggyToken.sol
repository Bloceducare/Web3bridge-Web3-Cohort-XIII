// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract piggyToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("PIGGY", "PGT") {
        _mint(msg.sender, initialSupply);
    }
}