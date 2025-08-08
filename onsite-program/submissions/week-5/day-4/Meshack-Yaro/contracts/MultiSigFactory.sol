// SPDX-License-Identifier: MIT

import "./MultiSig.sol";

pragma solidity ^0.8.28;

contract MultiSigFactory {

    MultiSig[] public multiSigs;
    mapping(address => MultiSig[]) public userMultiSigs;

    function createMultiSigs(address[3] memory _owners) external {
        MultiSig newMultiSig = new MultiSig(_owners);
        multiSigs.push(newMultiSig);
        userMultiSigs[msg.sender].push(newMultiSig);
    }

    function getAllMultiSigs() external view returns (address[] memory) {
        address[] memory addresses = new address[](multiSigs.length);
        for (uint i = 0; i < multiSigs.length; i++) {
            addresses[i] = address(multiSigs[i]);
        }
        return addresses;
    }

    function getMyMultiSigs() external view returns (address[] memory) {
        MultiSig[] storage userContracts = userMultiSigs[msg.sender];
        address[] memory addresses = new address[](userContracts.length);
        for (uint i = 0; i < userContracts.length; i++) {
            addresses[i] = address(userContracts[i]);
        }
        return addresses;
    }
}
