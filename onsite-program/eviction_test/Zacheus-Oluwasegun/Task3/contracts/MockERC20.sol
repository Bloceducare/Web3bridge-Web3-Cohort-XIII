// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(uint256 _initialSupply) ERC20("Ludo Token", "LUDO") {
        _mint(msg.sender, _initialSupply * 10**decimals());
    }

    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }
}
