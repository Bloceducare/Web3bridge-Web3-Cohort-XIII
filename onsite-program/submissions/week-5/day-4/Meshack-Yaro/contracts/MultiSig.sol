// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../IMultiSig.sol";

contract MultiSig has IMultiSig {

    uint requiredApprovals;
    uint transactionCount;

    address[] public owners;

    mapping (address => bool) public isOwner;
    mapping (uint => Transaction) public transactions;
    mapping (uint => mapping (address => bool)) public approvals;

    constructor(address[3] memory _owners) {
        if (_owners[0] == address(0)) revert INVALID_ADDRESS();
        isOwner[_owners[0]] = true;
        owners.push(_owners[0]);

        if (_owners[1] == address(0)) revert INVALID_ADDRESS();
        if (_owners[1] == _owners[0]) revert DUPLICATED_OWNER();
        isOwner[_owners[1]] = true;
        owners.push(_owners[1]);


        if (_owners[2] == address(0)) revert INVALID_ADDRESS();
        if (_owners[2] == _owners[0] || _owners[2] == _owners[1]) revert DUPLICATE_OWNER();
        isOwner[_owners[2]] = true;
        owners.push(_owners[2]);    

        requiredApprovals = 3;
        emit Initialized(_owners, requiredApprovals);
    }

    receive() external payable override {
        if (!isInitialized) revert NOT_INITIALIZED();
        emit Deposit(msg.sender, msg.value);
    }

    event TransactionProposed(uint256 indexed txId, address to, uint256 value, bytes data);
    event TransactionApproved(uint256 indexed txId, address owner);
    event TransactionExecuted(uint256 indexed txId);
    event Deposit(address indexed sender, uint256 value);
    event Initialized(address[3] owners, uint256 requiredApprovals);


    function proposedTransaction(address _to, uint256 _value, bytes memory _data) external returns (uint txId) {
        if (!isOwner[msg.sender]) revert NOT_OWNER();

        txId = transactionCount++;
        transactions[txId] = Transaction({to: _to, value: _value, data: _data, executed: false, approvalCount: 0});

        emit TransactionProposed(txId, _to, _value, _data);
        return txId;

    }

    function approveTransaction(uint256 _txId) external {
        if (!isInitialized) revert NOT_OWNER();
        if (!isOwner[msg.sender]) revert NOT_OWNER();

        Transaction storage transaction = transactions[_txId];
        if (transaction.to == address(0)) revert TRANSACTION_DOES_NOT_EXIST();
        if (transaction.executed) revert TRANSACTION_ALREADY_EXECUTED();
        if (approvals[_txId][msg.sender]) revert ALREADY_APPROVED();

        approvals[_txId][msg.sender] = true;
        transaction.approvalCount++;

        emit TransactionApproved(_txId, msg.sender);

        if (transaction.approvalCount >= requiredApprovals) executeTransaction(_txId);

    }

    function executeTransaction(uint256 _txId) internal {
        Transaction storage transaction = transactions[_txId];
        if (transaction.to == address(0)) revert TRANSACTION_DOES_NOT_EXIST();
        if (transaction.executed) revert TRANSACTION_ALREADY_EXECUTED();
        if (transaction.approvalCount < requiredApprovals) revert NOT_ENOUGH_APPROVALS();

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        if (!success) revert TRANSACTION_EXECUTION_FAILED();

        emit TransactionExecuted(_txId);

    }

    function getTransaction(uint256 _txId) external view returns (address to, uint256 value, bytes memory data, bool executed, uint256 approvalCount){
        Transaction memory transaction = transactions[_txId];
            return (transaction.to, transaction.value, transaction.data, transaction.executed, transaction.approvalCount);
    }



}NotInitialized