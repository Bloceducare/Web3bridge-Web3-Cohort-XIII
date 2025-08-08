// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SimpleMultiSig {
    
    // State variables
    address[] public owners;
    uint public requiredSignatures;
    uint public transactionCount;
    
    // Struct to represent a transaction
    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        uint approvalCount;
    }
    
    // Mappings
    mapping(uint => Transaction) public transactions;
    mapping(uint => mapping(address => bool)) public approvals;
    mapping(address => bool) public isOwner;
    
    // Events
    event TransactionProposed(uint indexed txId, address indexed proposer, address to, uint value);
    event TransactionApproved(uint indexed txId, address indexed approver);
    event TransactionExecuted(uint indexed txId);
    event DepositReceived(address indexed sender, uint amount);
    
    // Modifiers
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }
    
    modifier validTransaction(uint _txId) {
        require(_txId < transactionCount, "Transaction doesn't exist");
        require(!transactions[_txId].executed, "Transaction already executed");
        _;
    }
    
    // Constructor
    constructor(address[] memory _owners, uint _requiredSignatures) {
        require(_owners.length > 0, "Need at least one owner");
        require(_requiredSignatures > 0 && _requiredSignatures <= _owners.length, 
                "Invalid number of required signatures");
        
        // Set up owners
        for (uint i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0), "Invalid owner address");
            require(!isOwner[_owners[i]], "Duplicate owner");
            
            owners.push(_owners[i]);
            isOwner[_owners[i]] = true;
        }
        
        requiredSignatures = _requiredSignatures;
    }
    
    // Receive ETH deposits
    receive() external payable {
        emit DepositReceived(msg.sender, msg.value);
    }
    
    function proposeTransaction(address _to, uint _value, bytes memory _data) 
        public onlyOwner returns (uint) {
        
        uint txId = transactionCount;
        
        transactions[txId] = Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            approvalCount: 0
        });
        
        transactionCount++;
        
        emit TransactionProposed(txId, msg.sender, _to, _value);
        
        return txId;
    }
    
    function approveTransaction(uint _txId) 
        public onlyOwner validTransaction(_txId) {
        
        require(!approvals[_txId][msg.sender], "Already approved");
        
        approvals[_txId][msg.sender] = true;
        transactions[_txId].approvalCount++;
        
        emit TransactionApproved(_txId, msg.sender);
    }
    
    function executeTransaction(uint _txId) 
        public onlyOwner validTransaction(_txId) {
        
        Transaction storage transaction = transactions[_txId];
        
        require(transaction.approvalCount >= requiredSignatures, 
                "Not enough approvals");
        
        transaction.executed = true;
        
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "Transaction execution failed");
        
        emit TransactionExecuted(_txId);
    }
    
    function getOwners() public view returns (address[] memory) {
        return owners;
    }
    
    function getTransaction(uint _txId) public view returns (
        address to,
        uint value,
        bytes memory data,
        bool executed,
        uint approvalCount
    ) {
        Transaction memory transaction = transactions[_txId];
        return (transaction.to, transaction.value, transaction.data, 
                transaction.executed, transaction.approvalCount);
    }
    
    function hasApproved(uint _txId, address _owner) public view returns (bool) {
        return approvals[_txId][_owner];
    }
    
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}