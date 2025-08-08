// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


interface IMultiSignatureWallet{
    enum Status{PENDING, DONE}
// struct TransactionReciept{
//     uint id;
//     Status status;
// }
   struct Transaction{
        address[] approvals;
        uint amount;
        address reciever;
        uint timeCreated;
        uint transactionId;
        Status status;
    }
    function createTransferProposal(address reciever, uint amount) external;
}