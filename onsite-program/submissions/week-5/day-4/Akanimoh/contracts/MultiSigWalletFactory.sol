// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./MultiSigWallet.sol";

contract MultiSigWalletFactory {
    event WalletCreated(address indexed wallet, address[] owners);

    function createWallet(address[] memory _owners) external returns (address wallet) {
        MultiSigWallet newWallet = new MultiSigWallet(_owners);
        wallet = address(newWallet);
        emit WalletCreated(wallet, _owners);
        return wallet;
    }
}