// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MultiSig {
    address[] private _owners;
    uint256 private constant _requiredSignatures = 3;
    
    struct Transaction {
        address to;
        uint256 value;
        bool executed;
        mapping(address => bool) signatures;
        uint256 signatureCount;
    }
    
    Transaction[] private _transactions;
    
    event TransactionCreated(uint256 indexed transactionId, address to, uint256 value);
    event TransactionSigned(uint256 indexed transactionId, address signer);
    event TransactionExecuted(uint256 indexed transactionId, address executor);
    
    constructor(address[] memory owners) {
        require(owners.length >= 3, "At least 3 owners required");
        for (uint256 i = 0; i < owners.length; i++) {
            require(owners[i] != address(0), "Invalid owner address");
            for (uint256 j = i + 1; j < owners.length; j++) {
                require(owners[i] != owners[j], "Duplicate owner address");
            }
        }
        _owners = owners;
    }
    
    function submitTransaction(address to, uint256 value) external {
        require(isOwner(msg.sender), "Not an owner");
        require(to != address(0), "Invalid destination address");
        require(value > 0, "Invalid value");
        
        uint256 transactionId = _transactions.length;
        _transactions.push();
        Transaction storage transaction = _transactions[transactionId];
        transaction.to = to;
        transaction.value = value;
        transaction.executed = false;
        transaction.signatureCount = 0;
        
        emit TransactionCreated(transactionId, to, value);
    }
    
    function signTransaction(uint256 transactionId) external {
        require(transactionId < _transactions.length, "Invalid transaction ID");
        Transaction storage transaction = _transactions[transactionId];
        require(!transaction.executed, "Transaction already executed");
        require(isOwner(msg.sender), "Not an owner");
        require(!transaction.signatures[msg.sender], "Already signed");
        
        transaction.signatures[msg.sender] = true;
        transaction.signatureCount++;
        
        emit TransactionSigned(transactionId, msg.sender);
        
        if (transaction.signatureCount >= _requiredSignatures) {
            executeTransaction(transactionId);
        }
    }
    
    function executeTransaction(uint256 transactionId) private {
        Transaction storage transaction = _transactions[transactionId];
        require(!transaction.executed, "Transaction already executed");
        require(transaction.signatureCount >= _requiredSignatures, "Insufficient signatures");
        
        transaction.executed = true;
        (bool success, ) = transaction.to.call{value: transaction.value}("");
        require(success, "Transfer failed");
        
        emit TransactionExecuted(transactionId, msg.sender);
    }
    
    function isOwner(address account) public view returns (bool) {
        for (uint256 i = 0; i < _owners.length; i++) {
            if (_owners[i] == account) {
                return true;
            }
        }
        return false;
    }
    
    function getTransaction(uint256 transactionId) 
        external 
        view 
        returns (address to, uint256 value, bool executed, uint256 signatureCount) 
    {
        require(transactionId < _transactions.length, "Invalid transaction ID");
        Transaction storage transaction = _transactions[transactionId];
        return (transaction.to, transaction.value, transaction.executed, transaction.signatureCount);
    }
    
    function getOwners() external view returns (address[] memory) {
        return _owners;
    }
    
    receive() external payable {}
}