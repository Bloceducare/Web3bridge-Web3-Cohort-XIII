// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

error UNAUTHORIZED();
error INVALID_TRANSACTION_ID();
error NOT_A_VALID_ADDRESS();
error NOT_AN_OWNER();
error NOT_A_VALID_VALUE();

contract MultiSig {
    address[] private addresses;
    uint8 private requiredSigners;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        mapping(address => bool) signatures;
    }

    Transaction[] private _transactions;

    constructor(address[] memory _addresses, uint8 _requiredSigners) {
        addresses = _addresses;
        requiredSigners = _requiredSigners;
    }

    function getSigners() external view returns(uint8) {
        return requiredSigners;
    }

    function getAddresses() external view returns(address[] memory) {
        return addresses;
    }

    function isOwnerIn(address _owner) public view returns(bool) {
        for(uint i = 0; i < addresses.length; i++) {
            if(addresses[i] == _owner) return true;
        }
        return false;
    }

    function countSignatures(Transaction storage transaction) private view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < 6; i++) {
            if (transaction.signatures[addresses[i]]) {
                count++;
            }
        }
        return count;
    }

    function getTransaction(uint256 transactionId) public view returns (address, uint256, bytes memory, bool, uint256) {
        if(transactionId > _transactions.length) revert INVALID_TRANSACTION_ID();

        Transaction storage transaction = _transactions[transactionId];
        return (transaction.to, transaction.value, transaction.data, transaction.executed, countSignatures(transaction));
    }

    function submitTransaction(address to, uint256 value, bytes memory data) public {
        if (!isOwnerIn(msg.sender)) revert NOT_AN_OWNER();
        if (to == address(0)) revert NOT_A_VALID_ADDRESS();
        if (value == 0) revert NOT_A_VALID_VALUE();

        uint256 transactionId = _transactions.length;
        _transactions.push();
        Transaction storage transaction = _transactions[transactionId];
        transaction.to = to;
        transaction.value = value;
        transaction.data = data;
        transaction.executed = false;

    }

    function signTransaction(uint256 transactionId) public {
        if (transactionId >= _transactions.length) revert INVALID_TRANSACTION_ID();
        Transaction storage transaction = _transactions[transactionId];
        if (transaction.executed) revert("Transaction already executed");
        if (!isOwnerIn(msg.sender)) revert NOT_AN_OWNER();
        if (transaction.signatures[msg.sender]) revert("Transaction already signed by this owner");

        transaction.signatures[msg.sender] = true;
        if(countSignatures(transaction) == requiredSigners) {
            executeTransaction(transactionId);
        }
    }

    function executeTransaction(uint256 transactionId) private {
        if (transactionId >= _transactions.length) revert INVALID_TRANSACTION_ID();
        Transaction storage transaction = _transactions[transactionId];
        if (transaction.executed) revert("Transaction already executed");
        if (countSignatures(transaction) < requiredSigners) revert("Insufficient valid signatures");

        transaction.executed = true;
        (bool success,) = transaction.to.call{value: transaction.value}(transaction.data);
        if(!success) revert ("Transaction execution failed");
    }

    receive() external payable {}
    fallback() external payable {}
}
