// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IMultiSignatureWallet{
    function Status(address recieverAddress, uint amount) external;
}