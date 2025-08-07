// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./MultiSig.sol";

contract MultiSigFactory {
    address[] public allMultiSigAddr; 

    function createMultiSig(address[] memory _owners, uint _required) external{
        MultiSig wallet = new MultiSig(_owners, _required); 
        allMultiSigAddr.push(address(wallet)); 
    }

    function getMultiSig() external view returns (address[] memory) {
        return allMultiSigAddr; 
    }
}