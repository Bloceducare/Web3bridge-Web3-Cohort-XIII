// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MultiSignatureWallet {

    address[] public owners;                          
    mapping(address => bool) public isOwner;          
    uint public requiredConfirmations;                

    struct Transaction {
        address to;            
        uint value;            
        bytes data;            
        bool executed;         
        uint confirmations;    
    }

    Transaction[] public transactions;

    
    mapping(uint => mapping(address => bool)) public isConfirmed;

    event TransactionSubmitted(uint indexed txId, address indexed to, uint value);
    event TransactionConfirmed(uint indexed txId, address indexed owner);
    event TransactionRevoked(uint indexed txId, address indexed owner);
    event TransactionExecuted(uint indexed txId);

    constructor(address[] memory _owners) {
        require(_owners.length > 0, "Owners required");

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner address");
            require(!isOwner[owner], "Owner must be unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        requiredConfirmations = _owners.length; 
    }

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    modifier txExists(uint _txId) {
        require(_txId < transactions.length, "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint _txId) {
        require(!transactions[_txId].executed, "Transaction already executed");
        _;
    }

    modifier notConfirmed(uint _txId) {
        require(!isConfirmed[_txId][msg.sender], "Already confirmed");
        _;
    }

    receive() external payable {}  

    function submitTransaction(address _to, uint _value, bytes calldata _data) external onlyOwner {
        transactions.push(Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            confirmations: 0
        }));

        emit TransactionSubmitted(transactions.length - 1, _to, _value);
    }

    function confirmTransaction(uint _txId) external onlyOwner txExists(_txId) notExecuted(_txId) notConfirmed(_txId) {
        isConfirmed[_txId][msg.sender] = true;
        transactions[_txId].confirmations++;

        emit TransactionConfirmed(_txId, msg.sender);

        if (transactions[_txId].confirmations == requiredConfirmations) {
            executeTransaction(_txId);
        }
    }

    function revokeConfirmation(uint _txId) external onlyOwner  txExists(_txId) notExecuted(_txId) {
        require(isConfirmed[_txId][msg.sender], "Not yet confirmed");
        transactions[_txId].confirmations--;
        isConfirmed[_txId][msg.sender] = false;
        emit TransactionRevoked(_txId, msg.sender);
    }

    function executeTransaction(uint _txId) internal txExists(_txId) notExecuted(_txId) {
        Transaction storage transaction = transactions[_txId];
        require(transaction.confirmations >= requiredConfirmations, "Not enough confirmations");
        transaction.executed = true;
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "Transaction failed");

        emit TransactionExecuted(_txId);
    }
}
