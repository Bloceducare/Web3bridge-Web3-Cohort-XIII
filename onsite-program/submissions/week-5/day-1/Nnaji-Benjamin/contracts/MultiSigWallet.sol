// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MultiSigWallet {
    event Deposit(address indexed sender, uint256 amount);
    event TransactionSubmitted(uint256 indexed txId, address indexed to, uint256 value);
    event TransactionConfirmed(uint256 indexed txId, address indexed owner);
    event TransactionRevoked(uint256 indexed txId, address indexed owner);
    event TransactionExecuted(uint256 indexed txId);

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
    }

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public requiredConfirmations;

    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public isConfirmed;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    modifier txExists(uint256 _txId) {
        require(_txId < transactions.length, "Tx does not exist");
        _;
    }

    modifier notExecuted(uint256 _txId) {
        require(!transactions[_txId].executed, "Already executed");
        _;
    }

    modifier notConfirmed(uint256 _txId) {
        require(!isConfirmed[_txId][msg.sender], "Already confirmed");
        _;
    }

    constructor(address[] memory _owners, uint256 _requiredConfirmations) {
        require(_owners.length > 0, "Owners required");
        require(_requiredConfirmations > 0 && _requiredConfirmations <= _owners.length, "Invalid confirmations");

        for (uint256 i; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        requiredConfirmations = _requiredConfirmations;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function submitTransaction(address _to, uint256 _value, bytes calldata _data) external onlyOwner {
        uint256 txId = transactions.length;

        transactions.push(Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            confirmations: 0
        }));

        emit TransactionSubmitted(txId, _to, _value);
    }

    function confirmTransaction(uint256 _txId)
        external
        onlyOwner
        txExists(_txId)
        notExecuted(_txId)
        notConfirmed(_txId)
    {
        isConfirmed[_txId][msg.sender] = true;
        transactions[_txId].confirmations += 1;
        emit TransactionConfirmed(_txId, msg.sender);
    }

    function revokeConfirmation(uint256 _txId)
        external
        onlyOwner
        txExists(_txId)
        notExecuted(_txId)
    {
        require(isConfirmed[_txId][msg.sender], "Not confirmed");

        isConfirmed[_txId][msg.sender] = false;
        transactions[_txId].confirmations -= 1;
        emit TransactionRevoked(_txId, msg.sender);
    }

    function executeTransaction(uint256 _txId)
        external
        onlyOwner
        txExists(_txId)
        notExecuted(_txId)
    {
        Transaction storage transaction = transactions[_txId];
        require(transaction.confirmations >= requiredConfirmations, "Not enough confirmations");

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "Tx failed");

        emit TransactionExecuted(_txId);
    }

    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getTransaction(uint256 _txId)
        public
        view
        returns (address to, uint256 value, bytes memory data, bool executed, uint256 confirmations)
    {
        Transaction memory txn = transactions[_txId];
        return (txn.to, txn.value, txn.data, txn.executed, txn.confirmations);
    }
}
