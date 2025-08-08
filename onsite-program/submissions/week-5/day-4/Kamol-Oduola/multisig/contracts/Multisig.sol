// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MultiSigWallet {
    address[] public owners;
    uint public requiredApprovals;

    struct Transaction {
        address to;
        uint amount;
        uint approvals;
        bool executed;
        mapping(address => bool) isApproved;
    }

    Transaction[] public transactions;

    modifier onlyOwner() {
        bool isOwner = false;
        for (uint i = 0; i < owners.length; i++) {
            if (msg.sender == owners[i]) isOwner = true;
        }
        require(isOwner, "Not an owner");
        _;
    }

    constructor(address[] memory _owners, uint _requiredApprovals) {
        require(_owners.length >= _requiredApprovals, "Not enough owners");
        owners = _owners;
        requiredApprovals = _requiredApprovals;
    }

    receive() external payable {}

    function submitTransaction(address _to, uint _amount) external onlyOwner {
        transactions.push();
        Transaction storage txn = transactions[transactions.length - 1];
        txn.to = _to;
        txn.amount = _amount;
        txn.approvals = 0;
        txn.executed = false;
    }

    function approveTransaction(uint _txIndex) external onlyOwner {
        Transaction storage txn = transactions[_txIndex];
        require(!txn.executed, "Already executed");
        require(!txn.isApproved[msg.sender], "Already approved");

        txn.isApproved[msg.sender] = true;
        txn.approvals++;

        if (txn.approvals >= requiredApprovals) {
            executeTransaction(_txIndex);
        }
    }

    function executeTransaction(uint _txIndex) internal {
        Transaction storage txn = transactions[_txIndex];
        require(!txn.executed, "Already executed");

        txn.executed = true;
        payable(txn.to).transfer(txn.amount);
    }

    function getTransaction(uint _txIndex) public view returns (
        address to, uint amount, uint approvals, bool executed
    ) {
        Transaction storage txn = transactions[_txIndex];
        return (txn.to, txn.amount, txn.approvals, txn.executed);
    }

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }
}
