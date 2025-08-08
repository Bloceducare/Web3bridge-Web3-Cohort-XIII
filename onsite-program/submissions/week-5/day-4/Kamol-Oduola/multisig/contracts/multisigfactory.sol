// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Multisig.sol";

contract MultiSigFactory {
    address[] public allWallets;


    function createWallet(address[] memory _owners, uint _requiredApprovals) external {
        MultiSigWallet wallet = new MultiSigWallet(_owners, _requiredApprovals);
        allWallets.push(address(wallet));
    }

    function getAllWallets() public view returns (address[] memory) {
        return allWallets;
    }
}
