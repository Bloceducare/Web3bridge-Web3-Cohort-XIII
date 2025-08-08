// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./IMultiSig.sol";
// library WalletLibrary {

// }

contract MultiSignatureWallet is IMultiSignatureWallet{
 
    Transaction[] allTransactions;
    uint counter = 101;
    address[] walletOwners;
    mapping(uint => address[]) public approvals;

    constructor(address[] memory owners){
        require(owners.length> 3, OWNERS_MUST_BE_GREATER_THAN_3());
        walletOwners = owners;
    }

    error OWNERS_MUST_BE_GREATER_THAN_3();
    error UNAUTHORIZED();
    error INVALID_ID();
        fallback() external{}
        receive()external payable {}


    function createTransferProposal(address receiver, uint amount) external {
        require(isAddressInArray(walletOwners, msg.sender), UNAUTHORIZED());
        approvals[counter].push(msg.sender);
        allTransactions.push(Transaction({
            approvals: approvals[counter],
            amount: amount,
            reciever: receiver,
            timeCreated: block.timestamp,
            transactionId: counter,
            status: Status.PENDING
        }));
        counter++;
    }

    function isAddressInArray(address[] memory arr, address target) private pure returns (bool) {
        for (uint i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                return true;
            }
        }
        return false;
    }

    function getAllTransactions() external view returns (Transaction[] memory){
        return allTransactions;
    }

    function approveTransaction(uint transactionId) external {
    for (uint i = 0; i < allTransactions.length; i++) {
        if (transactionId == allTransactions[i].transactionId) {
            if (!isAddressInArray(walletOwners, msg.sender)) revert UNAUTHORIZED();
            if (isAddressInArray(approvals[transactionId], msg.sender)) return;
            approvals[transactionId].push(msg.sender);
            allTransactions[i].approvals.push(msg.sender);
            if (allTransactions[i].approvals.length >= 3 &&allTransactions[i].status != Status.DONE) {
                allTransactions[i].status = Status.DONE;
                payable(allTransactions[i].reciever).transfer(allTransactions[i].amount);
            }
            return;
        }
    }
    revert INVALID_ID();
}

}