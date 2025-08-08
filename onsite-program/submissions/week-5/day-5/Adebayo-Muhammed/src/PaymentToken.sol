// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract PaymentToken is ERC20 {
    constructor() ERC20("Event Token", "EVENT") {
        _mint(msg.sender, 1000000 * 10**18); // 1M tokens to deployer
    }

    // Anyone can mint tokens (for testing)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}