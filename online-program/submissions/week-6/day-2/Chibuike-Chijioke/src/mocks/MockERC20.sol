// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "interfaces/IERC20.sol";

contract MockERC20 is IERC20 {
    mapping (address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;

    function approve(address spender, uint256 amount) external override returns (bool) {
        allowances[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balances[from] >= amount, "Insufficient balance");
        balances[from] -= amount;
        balances[to] += amount;
        return true;
    }

    function mint(address to, uint256 amount) external {
        balances[to] += amount;
    }
}