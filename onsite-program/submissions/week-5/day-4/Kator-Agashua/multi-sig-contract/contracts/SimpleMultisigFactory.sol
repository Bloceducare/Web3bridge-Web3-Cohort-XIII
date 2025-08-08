// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {SimpleMultisig} from "./SimpleMultisig.sol";

contract SimpleMultisigFactory {
    address[] public deployedMultisigs;
    
    event MultisigCreated(
        address indexed multisigAddress,
        address indexed creator,
        address signer1,
        address signer2, 
        address signer3
    );
    
    // Deploy a new multisig contract
    function createMultisig(
        address _signer1,
        address _signer2,
        address _signer3
    ) external returns (address) {
        require(_signer1 != address(0) && _signer2 != address(0) && _signer3 != address(0), "Invalid signer address");
        require(_signer1 != _signer2 && _signer1 != _signer3 && _signer2 != _signer3, "Signers must be unique");
        
        // Deploy new multisig contract
        SimpleMultisig newMultisig = new SimpleMultisig(_signer1, _signer2, _signer3);
        
        // Store the address
        deployedMultisigs.push(address(newMultisig));
        
        // Emit event
        emit MultisigCreated(address(newMultisig), msg.sender, _signer1, _signer2, _signer3);
        
        return address(newMultisig);
    }
    
    // Get all deployed multisig addresses
    function getDeployedMultisigs() external view returns (address[] memory) {
        return deployedMultisigs;
    }
    
    // Get number of deployed multisigs
    function getMultisigCount() external view returns (uint256) {
        return deployedMultisigs.length;
    }
    
    // Get multisig by index
    function getMultisigByIndex(uint256 index) external view returns (address) {
        require(index < deployedMultisigs.length, "Index out of bounds");
        return deployedMultisigs[index];
    }
}