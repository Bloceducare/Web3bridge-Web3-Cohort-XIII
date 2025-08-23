// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./MultiSig.sol";

contract MultiSigFactory {
    // Array to store addresses of deployed MultiSig wallets
    address[] public deployedWallets;

    // Event emitted when a new MultiSig wallet is created
    event WalletCreated(address indexed walletAddress, address[] owners, uint required);

    // Function to create a new MultiSig wallet
    function createMultiSigWallet(address[] memory _owners, uint _required) public returns (address) {
        // Deploy a new MultiSig contract
        MultiSig newWallet = new MultiSig(_owners, _required);
        
        // Store the address of the new wallet
        deployedWallets.push(address(newWallet));
        
        // Emit event for wallet creation
        emit WalletCreated(address(newWallet), _owners, _required);
        
        return address(newWallet);
    }

    // Function to get all deployed wallets
    function getDeployedWallets() public view returns (address[] memory) {
        return deployedWallets;
    }

    // Function to get the count of deployed wallets
    function getWalletCount() public view returns (uint) {
        return deployedWallets.length;
    }
}