// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import "./../Multisig.sol";

contract MultiSigFactory {
    event WalletCreated(
        address indexed wallet,
        address[] owners,
        uint numConfirmationsRequired,
        address indexed creator
    );

    address[] public deployedWallets;

    mapping(address => address[]) public creatorWallets;

    function createSignature(
        address[] memory _owners,
        uint _numConfirmationsRequired
    ) public returns (address wallet) {
        wallet = address(new MultiSig(_owners, _numConfirmationsRequired));

        deployedWallets.push(wallet);
        creatorWallets[msg.sender].push(wallet);

        emit WalletCreated(
            wallet,
            _owners,
            _numConfirmationsRequired,
            msg.sender
        );
    }

    function getDeployedSig() public view returns (address[] memory) {
        return deployedWallets;
    }

    function getSigByCreator(
        address _creator
    ) public view returns (address[] memory) {
        return creatorWallets[_creator];
    }

    function getDeployedSigCount() public view returns (uint) {
        return deployedWallets.length;
    }
}
