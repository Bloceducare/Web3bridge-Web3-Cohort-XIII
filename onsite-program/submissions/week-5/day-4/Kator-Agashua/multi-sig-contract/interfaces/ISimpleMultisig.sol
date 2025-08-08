// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ISimpleMultisig {
    event TransactionProposed(uint256 transactionId, address to, uint256 amount);
    event TransactionApproved(uint256 transactionId, address signer);
    event TransactionExecuted(uint256 transactionId, address to, uint256 amount);
    
    function proposeTransaction(address to, uint256 amount) external;
    function approveTransaction(uint256 transactionId) external;
    function executeTransaction(uint256 transactionId) external;
    function getBalance() external view returns (uint256);
}