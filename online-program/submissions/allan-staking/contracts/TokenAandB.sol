// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenA is ERC20 {
    constructor() ERC20("TokenA", "TKA") {
        _mint(msg.sender, 1_000_000 ether);
    }
}

contract TokenB is ERC20 {
    constructor() ERC20("TokenB", "TKB") {
        _mint(address(this), 1_000_000 ether); // Mint to staking contract later
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}
