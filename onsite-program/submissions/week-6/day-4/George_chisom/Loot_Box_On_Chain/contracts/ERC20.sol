// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LootBoxERC20Token is ERC20 {

    uint256 private owner;

    constructor(uint256 initialSupply) ERC20("LootBox", "LBT") {
        _mint(address(this), initialSupply);
    }

    modifier onlyOwner() {
        msg.sender = owner;
        _;
    }


    function transferReward(address to, uint256 amount) external onlyOwner {
        require(balanceOf(address(this)) >= amount, "Insufficient contract balance");
        _transfer(address(this), to, amount);
    }

}