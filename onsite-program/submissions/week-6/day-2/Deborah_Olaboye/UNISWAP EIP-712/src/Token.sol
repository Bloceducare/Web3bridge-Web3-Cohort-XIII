// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract WolfToken is ERC20Permit {
    constructor() ERC20("Wolf Token ", "WTK") ERC20Permit("Wolf Token") {
        _mint(msg.sender, 1_000_000 * 1e18);
    }
}
