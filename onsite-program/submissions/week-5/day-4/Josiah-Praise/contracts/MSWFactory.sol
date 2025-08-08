//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {MultiSigWallet} from "./MSW.sol";

contract MSWFactory{
    MultiSigWallet[] public multisigWallets;

    function createWallet(address[] memory owners, uint threshold)external returns(address) {
        MultiSigWallet wallet = new MultiSigWallet(owners, threshold);
        multisigWallets.push(wallet);
        return address(wallet);
    }
}
