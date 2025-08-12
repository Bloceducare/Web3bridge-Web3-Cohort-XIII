// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MultiSigWallet {
    mapping(address => bool) public isOwner;
    address[] public owners;
    uint256 public requiredConfirmations;
    uint256 public transactionCount;
    
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
    }
    
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    
    event TransactionSubmitted(uint256 indexed txId, address indexed to, uint256 value);
    event TransactionConfirmed(uint256 indexed txId, address indexed owner);
    event TransactionRevoked(uint256 indexed txId, address indexed owner);
    event TransactionExecuted(uint256 indexed txId);
    event Deposit(address indexed sender, uint256 value);
    
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }
    
    modifier transactionExists(uint256 txId) {
        require(transactions[txId].to != address(0), "Transaction does not exist");
        _;
    }
    
    modifier notExecuted(uint256 txId) {
        require(!transactions[txId].executed, "Transaction already executed");
        _;
    }
    
    modifier notConfirmed(uint256 txId) {
        require(!confirmations[txId][msg.sender], "Transaction already confirmed");
        _;
    }
    
    modifier confirmed(uint256 txId) {
        require(confirmations[txId][msg.sender], "Transaction not confirmed");
        _;
    }
    
    constructor(address[] memory _owners, uint256 _requiredConfirmations) {
        require(_owners.length > 0, "Owners required");
        require(_requiredConfirmations > 0 && _requiredConfirmations <= _owners.length, "Invalid required confirmations");
        
        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");
            
            isOwner[owner] = true;
            owners.push(owner);
        }
        
        requiredConfirmations = _requiredConfirmations;
    }
    
    function submitTransaction(address to, uint256 value, bytes calldata data) external onlyOwner returns (uint256 txId) {
        require(to != address(0), "Invalid destination");
        
        txId = transactionCount;
        transactions[txId] = Transaction({
            to: to,
            value: value,
            data: data,
            executed: false,
            confirmations: 0
        });
        
        transactionCount++;
        
        emit TransactionSubmitted(txId, to, value);
    }
    
    function confirmTransaction(uint256 txId) external onlyOwner transactionExists(txId) notExecuted(txId) notConfirmed(txId) {
        Transaction storage transaction = transactions[txId];
        transaction.confirmations++;
        confirmations[txId][msg.sender] = true;
        
        emit TransactionConfirmed(txId, msg.sender);
    }
    
    function revokeConfirmation(uint256 txId) external onlyOwner transactionExists(txId) notExecuted(txId) confirmed(txId) {
        Transaction storage transaction = transactions[txId];
        transaction.confirmations--;
        confirmations[txId][msg.sender] = false;
        
        emit TransactionRevoked(txId, msg.sender);
    }
    
    function executeTransaction(uint256 txId) external onlyOwner transactionExists(txId) notExecuted(txId) {
        Transaction storage transaction = transactions[txId];
        require(transaction.confirmations >= requiredConfirmations, "Insufficient confirmations");
        
        transaction.executed = true;
        
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "Transaction execution failed");
        
        emit TransactionExecuted(txId);
    }
    
    function getOwners() external view returns (address[] memory) {
        return owners;
    }
    
    function getTransaction(uint256 txId) external view returns (address to, uint256 value, bytes memory data, bool executed, uint256 numConfirmations) {
        Transaction storage transaction = transactions[txId];
        return (transaction.to, transaction.value, transaction.data, transaction.executed, transaction.confirmations);
    }
    
    function isConfirmed(uint256 txId, address owner) external view returns (bool) {
        return confirmations[txId][owner];
    }
    
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }
    
    fallback() external payable {
        emit Deposit(msg.sender, msg.value);
    }
}
