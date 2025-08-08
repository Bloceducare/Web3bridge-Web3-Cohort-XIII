// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./SimpleMultiSig.sol";


contract MultiSigFactory {

    address[] public deployedMultiSigs;
    
    event MultiSigCreated(address indexed multiSigAddress, address[] owners, uint requiredSignatures);
    
    function createMultiSig(address[] memory _owners, uint _requiredSignatures) public {
        SimpleMultiSig newMultiSig = new SimpleMultiSig(_owners, _requiredSignatures);
        deployedMultiSigs.push(address(newMultiSig));

        emit MultiSigCreated(address(newMultiSig), _owners, _requiredSignatures);
    }
    
    function getDeployedMultiSigs() public view returns (address[] memory) {
        return deployedMultiSigs;
    }
    
    function getDeployedMultiSigsCount() public view returns (uint) {
        return deployedMultiSigs.length;
    }
}
