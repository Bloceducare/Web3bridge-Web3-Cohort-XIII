// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev Mock token for testing.
 */
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MCK") {}

    /**
     * @dev Mint tokens (for tests).
     * @param to Recipient.
     * @param amount Amount.
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}