//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20Token} "./ERC20Token.sol"

contract Factory {
    address[] public allERC20s;


    function createContract(string memory _name, string memory _symbol, uint _decimals, uint _totalSupply) external {
        owner = msg.sender;
        Contract newContract = new Contract(_name, _symbol, _decimals, _totalSupply, msg.sender);
        allErc20s.push(newContract);

    }

    function getAllERC20s() external view returns(Address[] memory) {
        return allERC20s;
    }
}