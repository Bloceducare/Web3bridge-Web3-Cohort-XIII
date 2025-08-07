// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../library/Storage.sol"; 
import "../library/error.sol";
import "../events/Events.sol";

contract MultiSig {
    using Storage for Storage.Layout; 

    modifier onlyOwner() {
        Storage.Layout storage ds = Storage.layout();
        require(ds.isOwner[msg.sender], "Not Owner"); 
        _; 
    }

    modifier txExists(uint _txId) {
        Storage.Layout storage ds = Storage.layout();
        require(_txId < ds.transactions.length, "Tx does not exist"); 
        _; 
    }

    modifier notApproved(uint _txId) {
        Storage.Layout storage ds = Storage.layout();
        require(!ds.approved[_txId][msg.sender], "Tx already approved"); 
        _; 
    }

    modifier notExecuted(uint _txId) {
        Storage.Layout storage ds = Storage.layout();
        require(!ds.transactions[_txId].executed, "Tx already executed"); 
        _; 
    }

    constructor(address[] memory _owners, uint _required) {
        Storage.Layout storage ds = Storage.layout();
        if (_required == 0) {
            revert Error.OWNER_REQUIRED();
        }

        if (_required > _owners.length) {
            revert Error.INVALID_NUMBER_OF_OWNERS();
        }

        for (uint i; i < _owners.length; i++) {
            address owner = _owners[i]; 

            if (owner == address(0)) {
                revert Error.INVALID_OWNER(); 
            }

            if (ds.isOwner[owner]) {
                revert Error.OWNER_NOT_UNIQUE(); 
            }

            ds.isOwner[owner] = true; 
            ds.owners.push(owner); 
        }

        ds.required = _required; 
    }

    receive() external payable {
        emit Events.Deposit(msg.sender, msg.value); 
    }

    function submit(address _to, uint _value, bytes calldata _data) external onlyOwner {
        Storage.Layout storage ds = Storage.layout();
        ds.transactions.push(Storage.Transaction({
            to: _to, 
            value: _value, 
            data: _data, 
            executed: false 
        })); 
        
        emit Events.Submit(ds.transactions.length - 1); 
    }

    function approve(uint _txId) external onlyOwner txExists(_txId) notApproved(_txId) notExecuted(_txId) {
        Storage.Layout storage ds = Storage.layout();
        ds.approved[_txId][msg.sender] = true; 

        emit Events.Approve(msg.sender, _txId);    
    }

    function _getApprovalCount(uint _txId) private view returns (uint count) {
        Storage.Layout storage ds = Storage.layout();
        for (uint i; i < ds.owners.length; i++) {
            if (ds.approved[_txId][ds.owners[i]]) {
                count += 1; 
            }
        }
    }

    function execute(uint _txId) external txExists(_txId) notExecuted(_txId) {
        Storage.Layout storage ds = Storage.layout(); 

        if (_getApprovalCount(_txId) < ds.required) {
            revert Error.APPROVAL_LESS_THAN_REQUIRED(); 
        }

        Storage.Transaction storage transaction = ds.transactions[_txId]; 
        transaction.executed = true; 

        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);

        if (!success) {
            revert Error.TX_FAILED();
        }
    }

    function revoke(uint _txId) external onlyOwner txExists(_txId) notExecuted(_txId) {
        Storage.Layout storage ds = Storage.layout();

        if (!ds.approved[_txId][msg.sender]) {
            revert Error.TX_NOT_APPROVED();
        }

        ds.approved[_txId][msg.sender] = false; 
        emit Events.Revoke(msg.sender, _txId);
    }

    function getTransaction(uint _txId) external  view  returns (address to, uint value, bytes memory data, bool executed)  {
        Storage.Layout storage ds = Storage.layout();
        Storage.Transaction storage txn = ds.transactions[_txId];
        return (txn.to, txn.value, txn.data, txn.executed);
}

}