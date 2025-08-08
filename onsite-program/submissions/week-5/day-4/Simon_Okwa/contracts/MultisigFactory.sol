// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./MultiSig.sol";

contract MultisigFactory {
    address[] public deployedWallets;

    event WalletCreated(address walletAddress, address[] owners, uint256 requiredSignatures);

    function createMultisig(
        address[] memory owners,
        uint256 requiredSignatures
    ) public returns (address) {
        // Deploy a new Multisig wallet
        MultiSig wallet = new MultiSig();
        wallet.initialize(owners, requiredSignatures);

        // Store the wallet address in the array
        deployedWallets.push(address(wallet));

        // Emit an event for off-chain indexing
        emit WalletCreated(address(wallet), owners, requiredSignatures);

        // Return the new wallet address
        return address(wallet);
    }

    function getDeployedWallets() public view returns (address[] memory) {
        return deployedWallets;
    }
}
