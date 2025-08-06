// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

contract MultiSignWallet {
    // Given Required Events in the project overview

    event TransactionSubmitted(uint256 indexed txId, address indexed to, uint256 value);
    event TransactionConfirmed(uint256 indexed txId, address indexed owner);
    event TransactionRevoked(uint256 indexed txId, address indexed owner);
    event TransactionExecuted(uint256 indexed txId);
    event Deposit(address indexed sender, uint amount, uint balance);

    // State variables for Wallet Owners

    address[] private walletOwners;
    mapping(address => bool) private isWalletOwner;
    uint256 private requiredApprovals;

    // Declaring Struct for Transaction Structure

    struct WalletTransaction {
        address destination;
        uint256 amount;
        bytes callData;
        bool isExecuted;
        uint256 approvalCount;
    }

    WalletTransaction[] private pendingTransactions;

    // Approval tracking: txId => owner => hasApproved
    mapping(uint256 => mapping(address => bool)) private approvals;

    // Modifiers
    modifier onlyWalletOwner() {
        require(isWalletOwner[msg.sender], "Access denied: Not a wallet owner");
        _;
    }

    modifier transactionExists(uint256 transactionIndex) {
        require(transactionIndex < pendingTransactions.length, "Transaction does not exist");
        _;
    }

    modifier notYetApproved(uint256 transactionIndex) {
        require(!approvals[transactionIndex][msg.sender], "Already approved by this owner");
        _;
    }

    modifier notYetExecuted(uint256 transactionIndex) {
        require(!pendingTransactions[transactionIndex].isExecuted, "Transaction already executed");
        _;
    }


    // Constructor to initialize the wallet
    constructor(address[] memory initialOwners, uint256 minApprovalsRequired) {
        require(initialOwners.length > 0, "At least one owner is required");
        require(minApprovalsRequired > 0 && minApprovalsRequired <= initialOwners.length, "Invalid approval threshold");

        for (uint256 index = 0; index < initialOwners.length; index++) {
            address owner = initialOwners[index];
            require(owner != address(0), "Invalid address");
            require(!isWalletOwner[owner], "Duplicate owner address");

            isWalletOwner[owner] = true;
            walletOwners.push(owner);
        }

        requiredApprovals = minApprovalsRequired;
    }


    // Accepting Ether deposits
    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    // Function that submit a new transaction to the wallet
    function proposeTransaction(address to, uint256 value, bytes memory data) external onlyWalletOwner{
        uint256 transactionId = pendingTransactions.length;

        pendingTransactions.push(WalletTransaction({
            destination: to,
            amount: value,
            callData: data,
            isExecuted: false,
            approvalCount: 0
        }));

        emit TransactionSubmitted(transactionId, to, value);
    }

    // Function that approve a proposed transaction
    function approveTransaction(uint256 transactionId) external onlyWalletOwner transactionExists(transactionId) notYetApproved(transactionId) notYetExecuted(transactionId) {
        WalletTransaction storage txn = pendingTransactions[transactionId];
        approvals[transactionId][msg.sender] = true;
        txn.approvalCount += 1;

        emit TransactionConfirmed(transactionId, msg.sender);
    }


    // Function that revoke an transaction approval
    function cancelApproval(uint256 transactionId) external onlyWalletOwner transactionExists(transactionId) notYetExecuted(transactionId) {
        require(approvals[transactionId][msg.sender], "Approval not found");

        WalletTransaction storage txn = pendingTransactions[transactionId];
        approvals[transactionId][msg.sender] = false;
        txn.approvalCount -= 1;

        emit TransactionRevoked(transactionId, msg.sender);
    }

    // Function that execute a transaction after threshold is reached
    function finalizeTransaction(uint256 transactionId) external onlyWalletOwner transactionExists(transactionId) notYetExecuted(transactionId) {
        WalletTransaction storage txn = pendingTransactions[transactionId];
        require(txn.approvalCount >= requiredApprovals, "Not enough approvals");

        txn.isExecuted = true;

        (bool success, ) = txn.destination.call{value: txn.amount}(txn.callData);
        require(success, "Transaction failed");

        emit TransactionExecuted(transactionId);
    }

    // Function to view all owners
    function getWalletOwners() external view returns (address[] memory) {
        return walletOwners;
    }


    // Function to view the number of transactions
    function getTransactionCount() external view returns (uint256) {
        return pendingTransactions.length;
    }

    // Function to view details of a transaction
    function viewTransaction(uint256 transactionId) external view returns (address destination, uint256 amount, bytes memory callData, bool isExecuted, uint256 approvalCount) {
        WalletTransaction memory txn = pendingTransactions[transactionId];
        return (
            txn.destination,
            txn.amount,
            txn.callData,
            txn.isExecuted,
            txn.approvalCount
        );
    }

}