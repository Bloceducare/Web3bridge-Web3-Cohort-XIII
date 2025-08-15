// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

error NotOwner();
error InvalidAddress();
error TxDoesNotExist();
error AlreadyApproved();
error NotEnoughApprovals();
error TxAlreadyExecuted();

contract SimpleMultiSig {
    address[] public users;
    uint256 public approvalsNeeded;

    struct Transaction {
        address to;
        uint256 value;
        bool executed;
        uint256 approvalCount;
        mapping(address => bool) approved;
    }

    mapping(uint256 => Transaction) public transactions;
    uint256 public txIndex;

    modifier onlyUser() {
        bool isUser = false;
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] == msg.sender) {
                isUser = true;
                break;
            }
        }
        if (!isUser) {
            revert NotOwner();
        }
        _;
    }

    constructor(address[] memory _users, uint256 _approvalsNeeded) {
        if (_users.length < _approvalsNeeded) revert InvalidAddress();
        users = _users;
        approvalsNeeded = _approvalsNeeded;
    }

    receive() external payable {}

    function submitTx(address _to, uint256 _value) external onlyUser {
        Transaction storage transaction = transactions[txIndex];
        transaction.to = _to;
        transaction.value = _value;
        transaction.executed = false;
        transaction.approvalCount = 0;
        txIndex++;
    }

    function approveTx(uint256 _txId) external onlyUser {
        if (_txId >= txIndex) revert TxDoesNotExist();

        Transaction storage transaction = transactions[_txId];
        if (transaction.executed) revert TxAlreadyExecuted();
        if (transaction.approved[msg.sender]) revert AlreadyApproved();

        transaction.approved[msg.sender] = true;
        transaction.approvalCount++;
    }

    function executeTx(uint256 _txId) external onlyUser {
        if (_txId >= txIndex) revert TxDoesNotExist();

        Transaction storage transaction = transactions[_txId];
        if (transaction.executed) revert TxAlreadyExecuted();
        if (transaction.approvalCount < approvalsNeeded)
            revert NotEnoughApprovals();

        transaction.executed = true;
        (bool sent, ) = transaction.to.call{value: transaction.value}("");
        if (!sent) revert();
    }

    function getUsers() external view returns (address[] memory) {
        return users;
    }
}
