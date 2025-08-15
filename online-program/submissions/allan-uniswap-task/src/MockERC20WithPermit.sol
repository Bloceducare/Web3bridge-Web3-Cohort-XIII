// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title MockERC20WithPermit
 * @dev Mock ERC-20 token with EIP-2612 permit functionality for testing
 * This contract implements the permit function allowing gasless approvals via EIP-712 signatures
 */
contract MockERC20WithPermit is ERC20, ERC20Permit {
    /**
     * @dev Constructor that mints initial supply to deployer
     * @param name Token name
     * @param symbol Token symbol
     * @param initialSupply Initial token supply to mint
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) ERC20Permit(name) {
        _mint(msg.sender, initialSupply);
    }

    /**
     * @dev Mint tokens to a specific address (for testing purposes)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
