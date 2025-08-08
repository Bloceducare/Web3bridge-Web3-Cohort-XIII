// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./multisig.sol";


contract Factory{

    mapping(address => address[]) public ownerToContracts;
    address[] public allContracts;


    function createMultisigContract() external{
        Multisig newMultisigContract = new Multisig();
        ownerToContracts[msg.sender].push(address(newMultisigContract));
        allContracts.push(address(newMultisigContract));
    }

    function getAllContracts() external view returns(address[] memory){
        return allContracts;
    }

    function getAllAddressContracts() external view returns (address[] memory) {
        return ownerToContracts[msg.sender];
    }
}