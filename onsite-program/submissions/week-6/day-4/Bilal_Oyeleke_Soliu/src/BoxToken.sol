
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BoxToken is ERC20, Ownable {
    constructor(uint256 initialSupply, address initialOwner) 
        ERC20("BoxERC20Token", "BE20") 
        Ownable(initialOwner) 
    {
        _mint(initialOwner, initialSupply);
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        return true;
    }
}