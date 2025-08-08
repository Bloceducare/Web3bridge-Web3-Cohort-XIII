// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.28;

import "../contracts/MultiSig.sol";

contract FactoryMultiSig {
    mapping(address => address[]) public wallets;

    address[] public allWallets;

    function createMultiSigContract(address[] memory _owners, uint256 _numConfirmationsRequired) external returns(address walletAddress) {
        MultiSigWallet newMultiSig = new MultiSigWallet(_owners, _numConfirmationsRequired);

        walletAddress = address(newMultiSig);
        allWallets.push(walletAddress);
    }
    function getWallets() external view returns(address[] memory) {
        return allWallets;
    }
}
