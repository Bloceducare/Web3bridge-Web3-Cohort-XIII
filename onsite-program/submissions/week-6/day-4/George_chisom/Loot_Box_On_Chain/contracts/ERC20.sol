// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LootBoxERC20Token is ERC20 {

    constructor(uint256 initialSupply) ERC20("LootBox", "LBT") {
        _mint(address(this), initialSupply);
    }


    function transferReward(address to, uint256 amount) external {
        require(balanceOf(address(this)) >= amount, "Insufficient contract balance");
        _transfer(address(this), to, amount);
    }

}