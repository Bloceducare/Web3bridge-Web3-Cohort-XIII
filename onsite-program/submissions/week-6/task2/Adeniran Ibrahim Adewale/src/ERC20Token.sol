// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// import { ERC20Permit } from "lib/openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
// import { Ownable } from "lib/openzeppelin/contracts/access/Ownable.sol";
import { ERC20Permit } from "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Permit.sol";
import { Ownable } from "openzeppelin-contracts/contracts/access/Ownable.sol";
import { ERC20 } from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract ERC20Token is ERC20Permit, Ownable {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply
    )
        ERC20(name_, symbol_)     
        ERC20Permit(name_)       
        Ownable(msg.sender)       
    {
        name_ = "Web3Bridge";
        symbol_ = "W3B";
        initialSupply = 1000e18; // 1000 tokens with 18 decimals
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
}
