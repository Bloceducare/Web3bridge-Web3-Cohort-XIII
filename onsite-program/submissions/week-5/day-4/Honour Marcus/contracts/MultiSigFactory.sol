// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./MultiSig.sol";  

contract MultiSigFactory{
    address[] public deployedMultiSig;

    function createMultiSig(address[] memory _owners) external {
        require(_owners.length >= 3, "At least 3 owners required");

        MultiSig wallet = new MultiSig(_owners, 3);
        deployedMultiSig.push(address(wallet));
    }

    function getDeployedMultiSig() external view returns (address[] memory) {
        return deployedMultiSig;
    }
}
