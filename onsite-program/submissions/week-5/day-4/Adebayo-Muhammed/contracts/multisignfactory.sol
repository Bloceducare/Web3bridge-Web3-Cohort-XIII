// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;


import "./multisign.sol";

contract MultiSignatureContractFactory {

    address[] public multiSignature;


    function createMultiSignatureContract(address[] memory _owners, uint _required) public {

        MultiSignatureAccount newContract = new MultiSignatureAccount(_owners, _required);

        address new_address = address(newContract);

        multiSignature.push(new_address);
    }

    function getDeployedContracts() public view returns (address[] memory) {

        return multiSignature;

    }

}