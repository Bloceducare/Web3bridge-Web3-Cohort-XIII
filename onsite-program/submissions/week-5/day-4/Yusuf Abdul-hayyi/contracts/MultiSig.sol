// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

error UNAUTHORIZED();
contract MultiSig {
    address[] public owners;
    uint256 public requiredSignatures;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        mapping(address => bool) signatures;
    }

    Transaction[] public transactions;

    event TransactionCreated(uint256 transactionId, address to, uint256 value, bytes data);
    event TransactionSigned(uint256 _transactionId, address signer);
    event TransactionExecuted(uint256 transactionId, address executer);

    constructor(address[] memory _owners, uint256 _requiredSignatures) {
        require(_owners.length > 0, "Owners required");
        require(_requiredSignatures >= 3 && _requiredSignatures <= _owners.length, "Invalid no. of required signatures");
        owners = _owners;
        requiredSignatures = _requiredSignatures;
    }

    function isOwner(address _owner) public view returns (bool) {
        for (uint256 i; i < owners.length; i++) {
            if (owners[i] == _owner) {
                return true;
            }
        }
        return false;
    }

    function countSignatures(Transaction storage transaction) private view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < owners.length; i++) {
            if (transaction.signatures[owners[i]]) {
                count++;
            }
        }
        return count;
    }

    function submitTransaction(address _to, uint256 _value, bytes memory _data) public {
        require(isOwner(msg.sender), "Not an owner");
        require(_to != address(0), "Invalid address");
        require(_value > 0, "Value must be greater than zero");
        transactions.push();
        uint256 transactionId = transactions.length -1;

        Transaction storage newTransaction = transactions[transactionId];
        newTransaction.to = _to;
        newTransaction.value = _value;
        newTransaction.data = _data;
        newTransaction.executed = false;
        newTransaction.signatures[msg.sender] = true;
        emit TransactionCreated(transactionId, _to, _value, _data);
    }

    function signTransaction(uint256 _transactionId) public {
        require(isOwner(msg.sender), "Not an owner");
        require(_transactionId < transactions.length, "Invalid transaction ID");
        Transaction storage transactions_ = transactions[_transactionId];
        require(!transactions_.executed, "Transaction already executed");
        require(!transactions_.signatures[msg.sender], "Already signed");
        transactions_.signatures[msg.sender] = true;
        emit TransactionSigned(_transactionId, msg.sender);
         if (countSignatures(transactions_) >= requiredSignatures) {
            executeTransaction(_transactionId);
  
         }
    }

    function executeTransaction(uint256 _transactionId) public {
        require(isOwner(msg.sender), "Not an owner");
        require(_transactionId < transactions.length, "Invalid transaction");
        Transaction storage transaction_ = transactions[_transactionId];
        require(!transaction_.executed, "Transaction already executed");

        transaction_.executed = true;
        (bool success, ) = transaction_.to.call{value: transaction_.value}(transaction_.data);
        require(success, "Transaction execution failed");
        emit TransactionExecuted(_transactionId, msg.sender);
    }

    receive() external payable {
        // Accepts ETH deposits
    }
}
