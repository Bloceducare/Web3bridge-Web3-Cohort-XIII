// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IMultiSigWallet {
    enum TransactionStatus { PENDING, EXECUTED, REJECTED }

    struct Transaction {
        uint256 id;
        address destination;
        uint256 value;
        bytes data;
        TransactionStatus status;
        uint256 approvals;
        bool exists;
    }

    event WalletCreated(address indexed wallet, address[] owners);
    event TransactionProposed(address indexed wallet, uint256 indexed txId, address destination, uint256 value);
    event TransactionApproved(address indexed wallet, uint256 indexed txId, address owner);
    event TransactionExecuted(address indexed wallet, uint256 indexed txId);
    event TransactionRejected(address indexed wallet, uint256 indexed txId);

    function proposeTransaction(address _destination, uint256 _value, bytes memory _data) external;
    function approveTransaction(uint256 _txId) external;
    function rejectTransaction(uint256 _txId) external;
    function getTransaction(uint256 _txId) external view returns (Transaction memory);
    function getOwners() external view returns (address[] memory);
}