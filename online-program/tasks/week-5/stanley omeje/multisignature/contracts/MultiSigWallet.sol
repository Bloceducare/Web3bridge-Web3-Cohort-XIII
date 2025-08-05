// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MultiSigWallet {
    // Events
    event TransactionSubmitted(
        uint256 indexed txId,
        address indexed to,
        uint256 value
    );
    event TransactionConfirmed(uint256 indexed txId, address indexed owner);
    event TransactionRevoked(uint256 indexed txId, address indexed owner);
    event TransactionExecuted(uint256 indexed txId);
    event Deposit(address indexed sender, uint256 amount, uint256 balance);

    // State variables
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public requiredConfirmations;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmationCount;
    }

    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public isConfirmed;

    // Modifiers
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    modifier txExists(uint256 _txId) {
        require(_txId < transactions.length, "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint256 _txId) {
        require(!transactions[_txId].executed, "Transaction already executed");
        _;
    }

    modifier notConfirmed(uint256 _txId) {
        require(
            !isConfirmed[_txId][msg.sender],
            "Transaction already confirmed"
        );
        _;
    }

    // Constructor
    constructor(address[] memory _owners, uint256 _requiredConfirmations) {
        require(_owners.length > 0, "Owners required");
        require(
            _requiredConfirmations > 0 &&
                _requiredConfirmations <= _owners.length,
            "Invalid number of required confirmations"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        requiredConfirmations = _requiredConfirmations;
    }

    // Receive function to accept ETH deposits
    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    // Submit a new transaction
    function submitTransaction(
        address _to,
        uint256 _value,
        bytes memory _data
    ) public onlyOwner {
        uint256 txId = transactions.length;

        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                confirmationCount: 0
            })
        );

        emit TransactionSubmitted(txId, _to, _value);
    }

    // Confirm a transaction
    function confirmTransaction(
        uint256 _txId
    ) public onlyOwner txExists(_txId) notExecuted(_txId) notConfirmed(_txId) {
        Transaction storage transaction = transactions[_txId];
        transaction.confirmationCount += 1;
        isConfirmed[_txId][msg.sender] = true;

        emit TransactionConfirmed(_txId, msg.sender);
    }

    // Revoke confirmation
    function revokeConfirmation(
        uint256 _txId
    ) public onlyOwner txExists(_txId) notExecuted(_txId) {
        require(isConfirmed[_txId][msg.sender], "Transaction not confirmed");

        Transaction storage transaction = transactions[_txId];
        transaction.confirmationCount -= 1;
        isConfirmed[_txId][msg.sender] = false;

        emit TransactionRevoked(_txId, msg.sender);
    }

    // Execute a transaction
    function executeTransaction(
        uint256 _txId
    ) public onlyOwner txExists(_txId) notExecuted(_txId) {
        Transaction storage transaction = transactions[_txId];

        require(
            transaction.confirmationCount >= requiredConfirmations,
            "Cannot execute transaction"
        );

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        require(success, "Transaction failed");

        emit TransactionExecuted(_txId);
    }

    // View functions
    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }

    function getTransaction(
        uint256 _txId
    )
        public
        view
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 confirmationCount
        )
    {
        Transaction storage transaction = transactions[_txId];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.confirmationCount
        );
    }
}
