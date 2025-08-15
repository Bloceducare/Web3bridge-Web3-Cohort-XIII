// SPDX-License-Idetifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20{
    uint private counter ;
    constructor() ERC20("GameToken","GTT"){
        counter = 0;
    }
    function mint(address receiver, uint value)external {
        _mint(receiver, value);
    }
}