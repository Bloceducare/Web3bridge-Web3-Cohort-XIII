// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./MultiSig.sol";

contract MultiSigFactory {
    address[] private _multiSigContracts;
   
    
    function createMultiSig(address[] memory owners) external returns (address) {
        require(owners.length >= 3, "At least 3 owners required");
        
        MultiSig newMultiSig = new MultiSig(owners);
        _multiSigContracts.push(address(newMultiSig));
        
       
        return address(newMultiSig);
    }
    
    function getMultiSigContracts() external view returns (address[] memory) {
        return _multiSigContracts;
    }
}