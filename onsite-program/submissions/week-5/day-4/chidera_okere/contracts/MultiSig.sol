// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;



import "../interfaces/IMultiSig.sol";
import "./libraries/MultiSigStorage.sol";


contract MultiSig is IMultiSig {
    using MultiSigStorage for MultiSigStorage.Transaction;

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public required;

    MultiSigStorage.Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public approved;

    modifier onlyOwner() {
        if(!isOwner[msg.sender]) {
            revert MultiSigStorage.NotOwner();
        }
        _;
    }

    modifier txExist(uint _txId) {
        if(_txId >= transactions.length) {
            revert MultiSigStorage.TransactionNotFound();
        }
        _;
    }

    modifier not_approved(uint _txId) {
        if(approved[_txId][msg.sender]) {
            revert MultiSigStorage.AlreadyConfirmed();
        }
        _;
    }

    modifier not_executed(uint _txId) {
        if(transactions[_txId].executed) {
            revert MultiSigStorage.TransactionAlreadyExecuted();
        }
        _;
    }

    constructor(address[] memory _owners, uint256 _required) {
        if(_owners.length < 1) {
            revert MultiSigStorage.InsufficientOwners();
        }
        if(_required > _owners.length || _required < 1) {
            revert MultiSigStorage.InvalidRequired();
        }

        for(uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            if(owner == address(0)) {
                revert MultiSigStorage.InvalidAddress();
            }
            if(isOwner[owner]) {
                revert MultiSigStorage.OwnerShouldBeUnique();
            }

            isOwner[owner] = true;
            owners.push(owner);
        }
        required = _required;
    }

    receive() external payable {}

    fallback() external payable {}

    function send_transaction(address _to, uint256 _value, bytes memory _data) 
        external 
        onlyOwner 
        returns(bool) 
    {
        MultiSigStorage.Transaction memory newTransaction = MultiSigStorage.Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false
        });
        
        transactions.push(newTransaction);
        return true;
    }

    function approve(uint _txId) 
        external 
        onlyOwner 
        txExist(_txId) 
        not_approved(_txId) 
        not_executed(_txId)
        returns(bool)
    {
        approved[_txId][msg.sender] = true;
        return true;
    }

    function execute(uint _txId) 
        external 
        onlyOwner 
        txExist(_txId) 
        not_executed(_txId)
    {
        if(getApprovalCount(_txId) < required) {
            revert MultiSigStorage.NotConfirmed();
        }

        MultiSigStorage.Transaction storage transaction = transactions[_txId];
        transaction.executed = true;

        (bool success,) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        
        if(!success) {
            revert MultiSigStorage.TransactionNotExecuted();
        }
    }

    function revoke(uint _txId) 
        external 
        onlyOwner 
        txExist(_txId) 
        not_executed(_txId)
    {
        if(!approved[_txId][msg.sender]) {
            revert MultiSigStorage.NotApproved();
        }
        approved[_txId][msg.sender] = false;
    }

    function getApprovalCount(uint _txId) public view returns(uint) {
        uint count = 0;
        for(uint i = 0; i < owners.length; i++) {
            if(approved[_txId][owners[i]]) {
                count++;
            }
        }
        return count;
    }

    function getOwners() external view returns(address[] memory) {
        return owners;
    }

    function getTransactionCount() external view returns(uint) {
        return transactions.length;
    }

    function getTransaction(uint _txId) 
        external 
        view 
        returns(address to, uint256 value, bytes memory data, bool executed) 
    {
        MultiSigStorage.Transaction storage transaction = transactions[_txId];
        return (transaction.to, transaction.value, transaction.data, transaction.executed);
    }
}


