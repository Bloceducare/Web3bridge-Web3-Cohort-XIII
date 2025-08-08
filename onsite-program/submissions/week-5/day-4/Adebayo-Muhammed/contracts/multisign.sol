// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

contract MultiSignatureAccount {

    struct Transaction {
        address acctAddress;
        uint value;
        bytes acctData;
        string acctDescription;
        bool executed;
    }

    event Deposited(address indexed sender, uint amount);
    event Submitted(uint indexed transID);
    event Approve(address indexed owner, uint indexed transID);
    event Revoke(address indexed owner, uint indexed transID);
    event Execute(uint indexed transID);

    error Stop();
    error Reverted();
    error Owners_Required();
    error Invalid_Number_of_Owners();
    error Invalid_Owner();
    error Owner_Is_Not_Unique();

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public required;
    Transaction[] public AccountData;
    mapping(uint => mapping(address => bool)) public approved;

    constructor(address[] memory _owners, uint _required) {
        if (_owners.length == 0) {
            revert Owners_Required();
        } else if (_required == 0 || _required > _owners.length) {
            revert Invalid_Number_of_Owners(); 
        } else {
            for (uint i; i < _owners.length; i++) {
                address owner = address(_owners[i]);
                if (owner == address(0)) {
                    revert Invalid_Owner();
                } else if (isOwner[owner]) {
                    revert Owner_Is_Not_Unique();
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
        emit Deposited(msg.sender, msg.value);
    }

    function submit(address _acctAddress, uint _value, bytes calldata _acctData, string memory _acctDescription) external onlyOwners {
        Transaction memory newAccount = Transaction({
            acctAddress: _acctAddress,
            value: _value,
            acctData: _acctData,
            acctDescription: _acctDescription,
            executed: false
        });
        AccountData.push(newAccount);
        emit Submitted(AccountData.length - 1);
    }

    function approve(uint _transID) external onlyOwners TransactionExists(_transID) notApproved(_transID) notExecuted(_transID) {
        approved[_transID][msg.sender] = true;
        emit Approve(msg.sender, _transID);
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

        Transaction storage transaction = AccountData[_transID];

        transaction.executed = true;

        (bool success, ) = transaction.acctAddress.call{value: transaction.value}(transaction.acctData);
        require(success, "Transaction execution failed");

        emit Execute(_transID);
    }

    function revoke(uint _transID) external onlyOwners TransactionExists(_transID) notExecuted(_transID) {
        require(approved[_transID][msg.sender], "Transaction not approved by owner");

        approved[_transID][msg.sender] = false;
        emit Revoke(msg.sender, _transID);
    }

    // Helper functions
    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getTransaction(uint _transID) 
        external 
        view 
        returns (
            address acctAddress,
            uint value,
            bytes memory acctData,
            string memory acctDescription,
            bool executed
        ) 
    {
        Transaction storage transaction = AccountData[_transID];
        return (
            transaction.acctAddress,
            transaction.value,
            transaction.acctData,
            transaction.acctDescription,
            transaction.executed
        );
    }

    function getTransactionCount() external view returns (uint) {
        return AccountData.length;
    }

    function view_transaction(uint _transID) external view returns (Transaction memory) {
        require(_transID < AccountData.length, "Transaction does not exist");
        return AccountData[_transID];
    }
}