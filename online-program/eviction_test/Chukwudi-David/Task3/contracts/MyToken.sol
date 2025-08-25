// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
  
    constructor() ERC20("LudoToken", "LUDO") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
