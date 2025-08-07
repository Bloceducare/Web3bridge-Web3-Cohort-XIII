// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {WEB3B} from "./WEB3B.sol";

contract WEB3BFactory {

    WEB3B[] public listOfweb3bContract;

    event TokenCreated(address tokenAddress);

    function createWEB3B(string memory _name, string memory _symbol,  uint8 _decimals, uint _totalSupply) public {
        WEB3B newWeb3B = new WEB3B (_name, _symbol, _decimals, _totalSupply);
        listOfweb3bContract.push(newWeb3B);
        emit TokenCreated(address(newWeb3B)); 
        
    }

    function getname(uint index) external view returns (string memory) {
        require(index < listOfweb3bContract.length, "Index out of bounds");
        return listOfweb3bContract[index].name();   
    }
    function getSymbol(uint index) external view returns (string memory) {
        require(index < listOfweb3bContract.length, "Index out of bounds");
        return listOfweb3bContract[index].symbol();   
    }
    function getDecimals(uint index) external view returns (uint8) {
        require(index < listOfweb3bContract.length, "Index out of bounds");
        return listOfweb3bContract[index].decimals();   
    }
    function getTotalSupply(uint index) external view returns (uint256) {
        require(index < listOfweb3bContract.length, "Index out of bounds");
        return listOfweb3bContract[index].totalSupply();   
    }
    function getAllWEB3Contract () external  view returns (WEB3B[] memory) {
        return listOfweb3bContract;
    }


}

