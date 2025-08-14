// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./MultiSigWallet.sol";

contract SimpleMultiSigFactory {
    address[] public deployedContracts;

    function createMultiSig(
        address[] memory _users,
        uint256 _approvalsNeeded
    ) external {
        SimpleMultiSig newMultiSig = new SimpleMultiSig(
            _users,
            _approvalsNeeded
        );
        deployedContracts.push(address(newMultiSig));
    }

    function getDeployed() external view returns (address[] memory) {
        return deployedContracts;
    }
}
