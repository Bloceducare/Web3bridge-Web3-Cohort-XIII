// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract MultiSigWallet {
    address[] public owners;
    uint public requiredApprovals = 3;

    struct Transaction {
        address payable to;
        uint amount;
        bool executed;
        uint approvals;
        mapping(address => bool) isApproved;
    }

    mapping(uint => Transaction) public transactions;
    uint public txCount;

    modifier onlyOwner() {
        bool isOwner = false;
        for (uint i = 0; i < owners.length; i++) {
            if (msg.sender == owners[i]) isOwner = true;
        }
        require(isOwner, "Not an owner");
        _;
    }

    constructor(address[] memory _owners) {
        require(_owners.length >= 3, "At least 3 owners required");
        owners = _owners;
    }

    receive() external payable {}

    function submitTransaction(address payable _to, uint _amount) external onlyOwner {
        Transaction storage txn = transactions[txCount];
        txn.to = _to;
        txn.amount = _amount;
        txn.executed = false;
        txCount++;
    }

    function approveTransaction(uint _txId) external onlyOwner {
        Transaction storage txn = transactions[_txId];
        require(!txn.executed, "Already executed");
        require(!txn.isApproved[msg.sender], "Already approved");

        txn.isApproved[msg.sender] = true;
        txn.approvals++;

        if (txn.approvals >= requiredApprovals) {
            _executeTransaction(_txId);
        }
    }

    function _executeTransaction(uint _txId) internal {
        Transaction storage txn = transactions[_txId];
        require(!txn.executed, "Already executed");
        require(address(this).balance >= txn.amount, "Insufficient balance");

        txn.executed = true;
        txn.to.transfer(txn.amount);
    }

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getTransaction(uint _txId) external view returns (
        address to, uint amount, bool executed, uint approvals
    ) {
        Transaction storage txn = transactions[_txId];
        return (txn.to, txn.amount, txn.executed, txn.approvals);
    }
}
