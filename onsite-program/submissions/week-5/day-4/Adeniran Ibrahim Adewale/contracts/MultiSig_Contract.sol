// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract MultiSig_Contract {

    event Deposit(address indexed sender, uint256 amount, uint balance);
    event TransactionCreated(address indexed sender, uint256 indexed transactionId, uint256 amount, address indexed to);
    event TransactionExecuted(address indexed sender, uint256 indexed transactionId, uint256 amount, address indexed to);
    event TransactionConfirmed(address indexed sender, uint256 indexed transactionId);
    event TransactionRevoked(address indexed sender, uint256 indexed transactionId);

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public numConfirmationsRequired;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        mapping(address => bool) isConfirmed;
        uint numConfirmations;
    }

    Transaction[] transactions;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    modifier txExists(uint _txIndex) {
        require(_txIndex < transactions.length, "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint _txIndex) {
        require(!transactions[_txIndex].executed, "Transaction already executed");
        _;
    }

    modifier notConfirmed(uint _txIndex) {
        require(!transactions[_txIndex].isConfirmed[msg.sender], "Transaction already confirmed");
        _;
    }

    constructor(address[] memory _owners, uint256 _numConfirmationsRequired) {
        require(_owners.length > 0, "Owners required");
        require(_numConfirmationsRequired > 0, "Confirmations required");
        require(_numConfirmationsRequired <= _owners.length, "Invalid number of confirmations required");

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            require(owner != address(0), "Invalid owner address");
            require(!isOwner[owner], "Owner not unique");
            
            isOwner[owner] = true;
            owners.push(owner);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
    }

    receive() payable external {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function deposit() payable external {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function submitTransaction(address _to, uint _value, bytes memory _data) public onlyOwner {
        uint transactionId = transactions.length;

        transactions.push();
        Transaction storage newTransaction = transactions[transactionId];
        newTransaction.to = _to;
        newTransaction.value = _value;
        newTransaction.data = _data;
        newTransaction.executed = false;
        newTransaction.numConfirmations = 0;

        emit TransactionCreated(msg.sender, transactionId, _value, _to);
    }

    function confirmTransaction(uint transactionId) public onlyOwner txExists(transactionId) notExecuted(transactionId) notConfirmed(transactionId) {
        Transaction storage transaction = transactions[transactionId];

        transaction.isConfirmed[msg.sender] = true;
        transaction.numConfirmations++;

        emit TransactionConfirmed(msg.sender, transactionId);
    }

    function executeTransaction(uint transactionId) public onlyOwner txExists(transactionId) notExecuted(transactionId) {
        Transaction storage transaction = transactions[transactionId];
        require(transaction.numConfirmations >= numConfirmationsRequired, "Cannot execute tx");

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "Transaction failed");

        emit TransactionExecuted(msg.sender, transactionId, transaction.value, transaction.to);
    }

    function revokeTransaction(uint transactionId) public onlyOwner txExists(transactionId) notExecuted(transactionId) {
        Transaction storage transaction = transactions[transactionId];
        require(transaction.isConfirmed[msg.sender], "Transaction not confirmed");

        transaction.isConfirmed[msg.sender] = false;
        transaction.numConfirmations--;

        emit TransactionRevoked(msg.sender, transactionId);
    }

    // View functions
    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }

    function getTransaction(uint _txIndex) public view returns (
        address to,
        uint value,
        bytes memory data,
        bool executed,
        uint numConfirmations
    ) {
        Transaction storage transaction = transactions[_txIndex];
        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations
        );
    }

    function isConfirmed(uint _txIndex, address _owner) public view returns (bool) {
        return transactions[_txIndex].isConfirmed[_owner];
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}