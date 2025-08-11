// contracts/MockToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock Token", "MOCK") {
        _mint(msg.sender, 1000000 * 10**18); 
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function faucet() public {
        _mint(msg.sender, 1000 * 10**18);
    }
}