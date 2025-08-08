// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MultiSig {
    uint256 private _requiredSignatures;
    address[] private _owners;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        mapping(address => bool) signatures;
    }

    // Array of transactions
    Transaction[] private _transactions;

    event TransactionCreated(uint256 transactionId, address to, uint256 value, bytes data);
    event TransactionSigned(uint256 transactionId, address signer);
    event TransactionExecuted(uint256 transactionId, address executer);

    modifier onlyOwner() {
        require(isOwner(msg.sender), "Not an owner!");
        _;
    }

    function initialize(address[] memory owners, uint256 requiredSignatures) public {
        require(_owners.length == 0, "Already initialized"); 
        require(owners.length > 0, "At least one owner required");
        require(requiredSignatures >= 3, "Must require at least 3 signatures");
        require(requiredSignatures <= owners.length, "Signatures exceed owner count");

        for (uint256 i = 0; i < owners.length; i++) {
            address owner = owners[i];
            require(owner != address(0), "Owner cannot be zero address");

           
            for (uint256 j = 0; j < i; j++) {
                require(owners[j] != owner, "Duplicate owner");
            }
            _owners.push(owner);
        }
        _requiredSignatures = requiredSignatures;
    }

    function submitTransaction(address to, uint256 value, bytes memory data) public onlyOwner {
        require(to != address(0), "Invalid destination address");

        uint256 transactionId = _transactions.length;
        _transactions.push();
        Transaction storage transaction = _transactions[transactionId];
        transaction.to = to;
        transaction.value = value;
        transaction.data = data;
        transaction.executed = false;

        emit TransactionCreated(transactionId, to, value, data);
    }

    function signTransaction(uint256 transactionId) public onlyOwner {
        require(transactionId < _transactions.length, "Invalid transaction ID");
        Transaction storage transaction = _transactions[transactionId];
        require(!transaction.executed, "Transaction already executed");
        require(!transaction.signatures[msg.sender], "Already signed");

        transaction.signatures[msg.sender] = true;
        emit TransactionSigned(transactionId, msg.sender);

        if (countSignatures(transaction) >= _requiredSignatures) {
            executeTransaction(transactionId);
        }
    }

    function executeTransaction(uint256 transactionId) private {
        require(transactionId < _transactions.length, "Invalid transaction ID");
        Transaction storage transaction = _transactions[transactionId];
        require(!transaction.executed, "Transaction already executed");
        require(countSignatures(transaction) >= _requiredSignatures, "Not enough signatures");

        transaction.executed = true;
        (bool success,) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "Execution failed");

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

    function countSignatures(Transaction storage transaction) private view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < _owners.length; i++) {
            if (transaction.signatures[_owners[i]]) {
                count++;
            }
        }
        return count;
    }

    function getTransaction(uint256 transactionId) public view returns (
        address to,
        uint256 value,
        bytes memory data,
        bool executed,
        uint256 signatureCount
    ) {
        require(transactionId < _transactions.length, "Invalid transaction ID");
        Transaction storage transaction = _transactions[transactionId];
        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            countSignatures(transaction)
        );
    }

    function getOwners() public view returns(address[] memory) {
        return _owners;
    }

    function getRequiredSignatures() public view returns(uint256) {
        return _requiredSignatures;
    }

    receive() external payable {}
}
