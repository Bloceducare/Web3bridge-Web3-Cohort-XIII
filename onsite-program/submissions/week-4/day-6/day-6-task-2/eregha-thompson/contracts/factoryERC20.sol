// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./ERC.sol";

contract ERC20factory{
    address[] allERCs;

    function createERC( string memory _name, string memory _symbol, uint8 _decimals) public{
        
        ERC20 erc = new ERC20(_name, _symbol, _decimals, msg.sender);
        allERCs.push(address(erc));
    }
    function getAllERCs () external view returns (address[] memory){
        return allERCs;
    }
}