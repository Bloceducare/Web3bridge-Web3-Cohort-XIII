// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../library/Storage.sol";
import "./LEDA.sol"; 

contract LEDAFactory {
    using Storage for Storage.Layout;

    function createToken(string memory _name, string memory _symbol, uint8 _decimals) external {
        Storage.Layout storage ds = Storage.layout();
        LEDA leda = new LEDA(_name, _symbol, _decimals); 
        ds.tokens.push(address(leda));
    }

    function getAllTokens() external view returns (address[] memory) {
        Storage.Layout storage ds = Storage.layout(); 
        return ds.tokens;
    }

}