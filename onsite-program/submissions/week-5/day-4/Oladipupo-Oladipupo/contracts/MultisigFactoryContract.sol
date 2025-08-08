// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Multisig.sol";

contract MultisigFactoryContract {
    address [] deployedContractAddresses;

    function createMultisigContract(address[] memory _signersAddresses, uint256 _noOfRequiredSigners) external{
        MultiSig multisig = new MultiSig(_signersAddresses, _noOfRequiredSigners);
        address contractAddress = address(multisig);
        deployedContractAddresses.push(contractAddress);
    }


    function getContractsAddress() external view returns (address [] memory){
        return deployedContractAddresses;
    }

}
