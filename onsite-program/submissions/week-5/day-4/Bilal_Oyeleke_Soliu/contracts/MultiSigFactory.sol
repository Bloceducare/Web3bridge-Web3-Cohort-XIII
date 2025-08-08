// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./MultiSig.sol";

contract MultisigFactory {
    address[] public allWallets;

    event WalletCreated(address walletAddress, address[] owners, uint256 requiredSignatures);

    function createWallet(address[] memory owners, uint256 requiredSignatures) external returns (address) {
        Multisig wallet = new Multisig(owners, requiredSignatures);
        allWallets.push(address(wallet));
        emit WalletCreated(address(wallet), owners, requiredSignatures);
        return address(wallet);
    }

    function getAllWallets() external view returns (address[] memory) {
        return allWallets;
    }
}
