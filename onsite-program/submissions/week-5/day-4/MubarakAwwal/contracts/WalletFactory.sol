// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./MultiSig.sol";

contract WalletFactory {
    address[] public deployedWallets;

    event WalletCreated(address wallet, address[] owners);

    function createWallet(address[] memory _owners) external {
        require(_owners.length >= 3, "At least 3 owners required");

        MultiSigWallet wallet = new MultiSigWallet(_owners);
        deployedWallets.push(address(wallet));

        emit WalletCreated(address(wallet), _owners);
    }

    function getDeployedWallets() external view returns (address[] memory) {
        return deployedWallets;
    }
}
