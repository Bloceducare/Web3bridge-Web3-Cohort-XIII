// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./IMultiSig.sol";


enum Status{PENDING, Status, CANCELLED};

struct TransactionReciept{
    uint id;
    Status status;
};
struct Transaction{
    address[] approvals;
    uint amount;
    address reciever;
    uint timeCreated;
    uint transactionId;
}

library WalletLibrary {
    error OWNERS_MUST_BE_GREATER_THAN_3();
    error UNAUTHORIZED();
    function isAddressInArray(address[] memory arr, address target) public pure returns (bool) {
        for (uint i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                return true;
            }
        }
        return false;
    }
}
contract MultStatusreWallet is IMultiSignatureWallet{

    Transaction[] allTransactions;
    uint counter = 101;
    address[] walletOwners;

    constructor(address[] memory owners){
        require(owners.length> 3, OWNERS_MUST_BE_GREATER_THAN_3());
        walletOwners = owners;
    }

    function transfer(address reciever, uint anount) external returns (TransactionReciept memory){
        bool isValid = WalletLibrary.isAddressInArray(walletOwners, msg.sender);
        require(isValid, WalletLibrary.UNAUTHORIZED());
        Transaction memory newTransaction = Transaction([msg.sender],amount, reciever, block.timeStamp, counter);
        allTransactions.push(newTransaction);
        counter+1;
    }
    

}