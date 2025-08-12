// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    uint8 private _unitDecimals;
    constructor(string memory name, string memory symbol, uint8 decimals_, uint256 initialSupply)
    ERC20(name, symbol)
    {
        _unitDecimals = decimals_;
        _mint(msg.sender, initialSupply * 10 ** decimals_);
    }

    function decimals() public view override returns (uint8) {
        return _unitDecimals;
    }
}