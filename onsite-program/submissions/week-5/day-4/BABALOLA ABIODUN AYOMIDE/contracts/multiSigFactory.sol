// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./IMultiSig.sol";
import "./MultiSigWallet.sol";

contract WalletFactory{
    mapping (address=>IMultiSignatureWallet) childContracts;
    IMultiSignatureWallet[] private walletsArray;
    function createWallet(address[] memory  addresses) external{
        IMultiSignatureWallet wallet = new MultiSignatureWallet(addresses);
        childContracts[address(wallet)] = wallet;
        walletsArray.push(wallet);
    }
    function getAllContracts() external view returns(IMultiSignatureWallet[] memory) {
        return walletsArray;
    }
}