// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

error NotOwner();
error TxDoesNotExist();
error TxAlreadyExecuted();
error TxAlreadyConfirmed();
error TxNotConfirmed();
error NotEnoughConfirmations();

contract MultiSigWallet {
    address[] public owners;
    uint public required;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        uint numConfirmations;
    }

    Transaction[] public transactions;
    mapping(address => bool) public isOwner;
    mapping(uint => mapping(address => bool)) public isConfirmed;

    event TransactionSubmitted(uint indexed txId, address indexed to, uint value);
    event TransactionConfirmed(uint indexed txId, address indexed owner);
    event TransactionRevoked(uint indexed txId, address indexed owner);
    event TransactionExecuted(uint indexed txId);

    modifier onlyOwner() {
        if (!isOwner[msg.sender]) revert NotOwner();
        _;
    }

    modifier txExists(uint _txId) {
        if (_txId >= transactions.length) revert TxDoesNotExist();
        _;
    }

    modifier notExecuted(uint _txId) {
        if (transactions[_txId].executed) revert TxAlreadyExecuted();
        _;
    }

    modifier notConfirmed(uint _txId) {
        if (isConfirmed[_txId][msg.sender]) revert TxAlreadyConfirmed();
        _;
    }

    constructor(address[] memory _owners, uint _required) {
        require(_owners.length > 0, "Owners required");
        require(_required > 0 && _required <= _owners.length, "Invalid required number");

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");
            isOwner[owner] = true;
            owners.push(owner);
        }

        required = _required;
    }

    receive() external payable {}

    function submitTransaction(address _to, uint _value, bytes calldata _data) external onlyOwner {
        transactions.push(Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            numConfirmations: 0
        }));

        emit TransactionSubmitted(transactions.length - 1, _to, _value);
    }

    function confirmTransaction(uint _txId)
        external
        onlyOwner
        txExists(_txId)
        notExecuted(_txId)
        notConfirmed(_txId)
    {
        isConfirmed[_txId][msg.sender] = true;
        transactions[_txId].numConfirmations += 1;

        emit TransactionConfirmed(_txId, msg.sender);
    }

    function revokeConfirmation(uint _txId)
        external
        onlyOwner
        txExists(_txId)
        notExecuted(_txId)
    {
        if (!isConfirmed[_txId][msg.sender]) revert TxNotConfirmed();

        transactions[_txId].numConfirmations -= 1;
        isConfirmed[_txId][msg.sender] = false;

        emit TransactionRevoked(_txId, msg.sender);
    }

    function executeTransaction(uint _txId)
        external
        onlyOwner
        txExists(_txId)
        notExecuted(_txId)
    {
        Transaction storage txn = transactions[_txId];

        if (txn.numConfirmations < required) revert NotEnoughConfirmations();

        txn.executed = true;

        (bool success, ) = txn.to.call{value: txn.value}(txn.data);
        require(success, "Transaction failed");

        emit TransactionExecuted(_txId);
    }

    // helper functions
    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() external view returns (uint) {
        return transactions.length;
    }

    function getTransaction(uint _txId)
        external
        view
        returns (
            address to,
            uint value,
            bytes memory data,
            bool executed,
            uint numConfirmations
        )
    {
        Transaction memory txn = transactions[_txId];
        return (
            txn.to,
            txn.value,
            txn.data,
            txn.executed,
            txn.numConfirmations
        );
    }
}
