// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract IPermitToken is ERC20 {
    constructor()ERC20("IPermitToken", "IPT"){ }
    function mintTo(address recieverAddress, uint quantity)external{
        _mint(recieverAddress, quantity);
    }
}