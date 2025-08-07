// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IMultiSignatureWallet{
    function transfer(address recieverAddress, uint amount) external;
}