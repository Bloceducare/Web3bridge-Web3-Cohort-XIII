// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "../libraries/Storage.sol";
import "../interface/MultiSignatureInterface.sol";

contract MultiSignatureAccount is iMultiSignatureAccountInterface {
    address[] public owners;

    mapping(address => bool) public isOwner;

    uint public required;

    Storage.MultiSignatureAccount[] public AccountData;

    mapping(uint => mapping(address => bool)) public approved;

    constructor(address[] memory _owners, uint _required) {
        if (_owners.length == 0) {
            revert Storage.Owners_Required();
        } else if (_required == 0 || _required > _owners.length) {
            revert Storage.Invalid_Number_of_Owners(); 
        } else {
            for (uint i; i < _owners.length; i++) {
                address owner = address(_owners[i]);
                if (owner == address(0)) {
                    revert Storage.Invalid_Owner();
                } else {
                    isOwner[owner] = true;
                    owners.push(owner);
                }
            }
        }
        required = _required;
    }

    modifier onlyOwners() {
        require(isOwner[msg.sender], "Only Owners Can Perform This Operation");
        _;
    }

    modifier TransactionExists(uint _transID) {
        require(_transID < AccountData.length, "Transaction does not exist");
        _;
    }

    modifier notApproved(uint _transID) {
        require(!approved[_transID][msg.sender], "Transaction already approved");
        _;
    }

    modifier notExecuted(uint _transID) {
        require(!AccountData[_transID].executed, "Transaction already executed");
        _;
    }

    receive() external payable {
        emit Storage.Deposited(msg.sender, msg.value);
    }

    function submit(address _acctAddress, uint _value, bytes calldata _acctData, string memory _acctDescription) external onlyOwners {
        Storage.MultiSignatureAccount memory newAccount = Storage.MultiSignatureAccount({
            acctAddress: _acctAddress,
            value: _value,
            acctData: _acctData,
            acctDescription: _acctDescription,
            executed: false
        });
        AccountData.push(newAccount);
        emit Storage.Submitted(AccountData.length - 1);
    }

    function approve(uint _transID) external onlyOwners TransactionExists(_transID) notApproved(_transID) notExecuted(_transID) {
        approved[_transID][msg.sender] = true;
        emit Storage.Approve(msg.sender, _transID);
    }

    function getApprovalCount(uint _transID) external onlyOwners view returns (uint count) {
        for (uint i; i < owners.length; i++) {
            if (approved[_transID][owners[i]]) {
                count += 1;
            }
        }
        return count;
    }

    function execute(uint _transID) external TransactionExists(_transID) notExecuted(_transID) {
        require(this.getApprovalCount(_transID) >= required, "Approval < Required");

        Storage.MultiSignatureAccount storage transaction = AccountData[_transID];

        transaction.executed = true;

        (bool success, ) = transaction.acctAddress.call{value: transaction.value}(transaction.acctData);
        require(success, "Transaction execution failed");

        emit Storage.Execute(_transID);
    }

    function revoke(uint _transID) external onlyOwners TransactionExists(_transID) notExecuted(_transID) {
        require(approved[_transID][msg.sender], "Transaction not approved by owner");

        approved[_transID][msg.sender] = false;
        emit Storage.Revoke(msg.sender, _transID);
    }

    function view_transaction(uint _transID) external view returns (Storage.MultiSignatureAccount memory) {
        require(_transID < AccountData.length, "Transaction does not exist");
        return AccountData[_transID];
    }
}