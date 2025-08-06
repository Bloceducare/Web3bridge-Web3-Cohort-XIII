//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ERC20Token.sol";

contract Factory {
    address[] public allERC20s;


    function createChild(string memory _name, string memory _symbol, uint _totalSupply) external {
       
        ERC20Token erc20 = new ERC20Token(_name, _symbol, _totalSupply, msg.sender);
        allERC20s.push(address(erc20));

    }

    function getAllERC20s() external view returns(address[] memory) {
        return allERC20s;
    }
}