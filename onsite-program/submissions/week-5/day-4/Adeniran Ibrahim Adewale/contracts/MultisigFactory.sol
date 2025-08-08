// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MultiSig_Contract.sol";

contract MultisigFactory {
    address public owner;
    uint256 public multisigCount;

    event MultisigCreated(address indexed multisigAddress, address[] owners, uint256 requiredSignatures);

    constructor() {
        owner = msg.sender;
        multisigCount = 0;
    }

    function createMultisig(address[] memory _owners, uint256 _requiredSignatures) public returns (address) {
        require(_owners.length > 0, "Owners required");
        require(_requiredSignatures > 0 && _requiredSignatures <= _owners.length, "Invalid number of required signatures");

        MultiSig_Contract newMultisig = new MultiSig_Contract(_owners, _requiredSignatures);
        multisigCount++;

        emit MultisigCreated(address(newMultisig), _owners, _requiredSignatures);
        return address(newMultisig);
    }
}