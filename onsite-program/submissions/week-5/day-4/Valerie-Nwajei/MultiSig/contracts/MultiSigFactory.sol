// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./MultiSig.sol";

contract MultiSigFactory{
    address[] accounts;

    function createMultiSig(address[] memory _owners, uint _confirmation) external{
        for(uint i = 0; i < _owners.length; i++){
        _owners[i] = msg.sender;
        }
        MultiSig account = new MultiSig(_owners, _confirmation);
        accounts.push(address(account));
    }
}