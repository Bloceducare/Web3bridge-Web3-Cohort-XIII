// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ERC20.sol";

contract ERC20Factory {
    event ERC20Deployed(address indexed tokenAddress, string name, string symbol);

    function deployERC20(
        string memory _name,
        string memory _symbol,
        uint256 _decimals,
        uint256 _initialSupply
    ) external returns (address) {
        ERC20 newToken = new ERC20(_name, _symbol, _decimals, _initialSupply);
        emit ERC20Deployed(address(newToken), _name, _symbol);
        return address(newToken);
    }
}