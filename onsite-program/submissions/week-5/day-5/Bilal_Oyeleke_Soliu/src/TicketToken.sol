// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract EventToken is ERC20 {
    constructor(string memory name_, string memory symbol_, uint256 initialSupply) ERC20(name_, symbol_) {
        _mint(msg.sender, initialSupply);
    }
}
