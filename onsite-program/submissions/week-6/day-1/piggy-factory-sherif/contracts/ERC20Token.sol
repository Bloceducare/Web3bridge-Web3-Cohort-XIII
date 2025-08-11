// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PiggyToken is ERC20 {
    address public owner;

    constructor(uint256 initialSupply) ERC20("Piggy", "PGY") {
        owner = msg.sender;
        _mint(msg.sender, initialSupply);
    }

    function sendFromContract(address _recipient, uint256 _amount) external {
        require(msg.sender == owner, "Only owner can send");
        require(balanceOf(address(this)) >= _amount, "Not enough tokens in contract");
        
        _transfer(address(this), _recipient, _amount);
    }

    function depositToContract(uint256 _amount) external {
        require(balanceOf(msg.sender) >= _amount, "Not enough tokens");
        _transfer(msg.sender, address(this), _amount);
    }
}