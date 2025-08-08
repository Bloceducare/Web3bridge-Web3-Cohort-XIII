// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ISimpleMultisig} from "../interfaces/ISimpleMultisig.sol";

contract SimpleMultisig is ISimpleMultisig {
    address public signer1;
    address public signer2; 
    address public signer3;
    
    uint256 public transactionCount;
    
    struct Transaction {
        address to;
        uint256 amount;
        bool signer1Approved;
        bool signer2Approved;
        bool signer3Approved;
        bool executed;
    }
    
    mapping(uint256 => Transaction) public transactions;
    
    
    constructor(address _signer1, address _signer2, address _signer3) {
        signer1 = _signer1;
        signer2 = _signer2;
        signer3 = _signer3;
    }
    
    // Allow contract to receive Ether
    receive() external payable {}
    
    // Step 1: Any signer proposes a transaction
    function proposeTransaction(address to, uint256 amount) external {
        require(msg.sender == signer1 || msg.sender == signer2 || msg.sender == signer3, "Not a signer");
        
        transactions[transactionCount] = Transaction({
            to: to,
            amount: amount,
            signer1Approved: false,
            signer2Approved: false,
            signer3Approved: false,
            executed: false
        });
        
        emit TransactionProposed(transactionCount, to, amount);
        transactionCount++;
    }
    
    // Step 2: Each signer approves the transaction
    function approveTransaction(uint256 transactionId) external {
        Transaction storage txn = transactions[transactionId];
        require(!txn.executed, "Transaction already executed");
        
        if (msg.sender == signer1) {
            txn.signer1Approved = true;
        } else if (msg.sender == signer2) {
            txn.signer2Approved = true;
        } else if (msg.sender == signer3) {
            txn.signer3Approved = true;
        } else {
            revert("Not a signer");
        }
        
        emit TransactionApproved(transactionId, msg.sender);
    }
    
    // Step 3: Execute when all 3 have approved
    function executeTransaction(uint256 transactionId) external {
        Transaction storage txn = transactions[transactionId];
        require(!txn.executed, "Transaction already executed");
        require(txn.signer1Approved && txn.signer2Approved && txn.signer3Approved, "Need all 3 approvals");
        
        txn.executed = true;
        
        (bool success, ) = txn.to.call{value: txn.amount}("");
        require(success, "Transfer failed");
        
        emit TransactionExecuted(transactionId, txn.to, txn.amount);
    }
    
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // Helper function to check transaction status
    function getTransactionApprovals(uint256 transactionId) external view returns (bool, bool, bool) {
        Transaction memory txn = transactions[transactionId];
        return (txn.signer1Approved, txn.signer2Approved, txn.signer3Approved);
    }
}