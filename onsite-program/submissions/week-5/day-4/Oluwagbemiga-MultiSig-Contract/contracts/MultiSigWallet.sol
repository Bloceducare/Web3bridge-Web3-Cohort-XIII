// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

    error NotOwner();
    error AlreadyExecuted();
    error TransactionFailed();
    error AlreadyApproved();
    error InvalidTransactionId();
    error InvalidOwners();
    error NotEnoughApprovals();

contract MultiSigWallet {
    
    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event TransactionProposed(address indexed proposer, uint256 indexed txId, address to, uint256 value, bytes data);
    event TransactionApproved(address indexed approver, uint256 indexed txId);
    event TransactionExecuted(address indexed executor, uint256 indexed txId, bool success);

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        mapping(address => bool) approvals;
        address[] approvers;
    }

    address[] public owners;
    mapping(address => bool) public isOwner;
    mapping(uint256 => Transaction) public transactions;
    uint256 public transactionCount;


    modifier onlyOwner() {
        if (!isOwner[msg.sender]) revert NotOwner();
        _;
    }

    modifier txExists(uint256 _txId) {
        if (_txId >= transactionCount) revert InvalidTransactionId();
        _;
    }

    modifier notExecuted(uint256 _txId) {
        if (transactions[_txId].executed) revert AlreadyExecuted();
        _;
    }

    modifier notApproved(uint256 _txId) {
        if (transactions[_txId].approvals[msg.sender]) revert AlreadyApproved();
        _;
    }

    constructor(address[] memory _owners) {
        if (_owners.length < 3) revert InvalidOwners();
        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            if (owner == address(0) || isOwner[owner]) revert InvalidOwners();
            isOwner[owner] = true;
            owners.push(owner);
        }
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function proposeTransaction(address _to, uint256 _value, bytes memory _data)
        external
        onlyOwner
        returns (uint256 txId)
    {
        txId = transactionCount++;
        Transaction storage transaction = transactions[txId];
        transaction.to = _to;
        transaction.value = _value;
        transaction.data = _data;
        transaction.executed = false;
        emit TransactionProposed(msg.sender, txId, _to, _value, _data);
        return txId;
    }

    function approveTransaction(uint256 _txId)
        external
        onlyOwner
        txExists(_txId)
        notExecuted(_txId)
        notApproved(_txId)
    {
        Transaction storage transaction = transactions[_txId];
        transaction.approvals[msg.sender] = true;
        transaction.approvers.push(msg.sender);
        emit TransactionApproved(msg.sender, _txId);
    }

    function executeTransaction(uint256 _txId)
        external
        onlyOwner
        txExists(_txId)
        notExecuted(_txId)
    {
        Transaction storage transaction = transactions[_txId];
        if (transaction.approvers.length < 3) revert NotEnoughApprovals();
        transaction.executed = true;
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        if (!success) revert TransactionFailed();
        emit TransactionExecuted(msg.sender, _txId, success);
    }

    function getTransaction(uint256 _txId)
        external
        view
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            address[] memory approvers
        )
    {
        Transaction storage transaction = transactions[_txId];
        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.approvers
        );
    }
}