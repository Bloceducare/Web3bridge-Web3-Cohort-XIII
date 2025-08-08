// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library Errors {
    error INVALID_ADDRESS();
    error INVALID_AMOUNT();
    error DUPLICATED_ADDRESS();
    error INVALID_ADMIN_COUNT();
    error COMPLETED();
    error ONLY_ADMIN();
}

contract Multisig {
    struct Transaction {
        address spender;
        uint Amount;
        uint numberOfApproval;
        bool isActive;
    }

    address[] admins;

    uint constant MINIMUM = 3;
    uint TransactionID;

    mapping(address => bool) isAdmin;
    mapping(uint => Transaction) transaction;

    mapping(uint => mapping(address => bool)) isApproved;
    mapping(address => uint) balanceOf;

    error InvalidAddress(uint position);

    constructor(address[] memory _admins) payable {
        require(_admins.length <= MINIMUM, Errors.INVALID_ADMIN_COUNT());

        for (uint i = 0; i < _admins.length; i++) {
            require(_admins[i] != address(0), Errors.INVALID_ADDRESS());
            require(_admins[i] == _admins[i], Errors.DUPLICATED_ADDRESS());

            isAdmin[_admins[i]] = true;
        }

        admins = _admins;
    }

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], Errors.ONLY_ADMIN());
        _;
    }

    function createTransaction(
        address _spender,
        uint _amount
    ) external onlyAdmin {
        require(_amount <= address(this).balance, Errors.INVALID_AMOUNT());

        TransactionID++;
        Transaction storage _transaction = transaction[TransactionID];
        _transaction.spender = _spender;
        _transaction.Amount = _amount;
        _transaction.isActive = true;

        _transaction.numberOfApproval = 1;
        isApproved[TransactionID][msg.sender] = true;
    }
    function getSpender(address _spender) external view returns (uint) {
        return balanceOf[_spender];
    }

    function ApprovedTransaction(uint ID) external onlyAdmin {
        require(!isApproved[ID][msg.sender], Errors.INVALID_ADDRESS());

        Transaction storage _transaction = transaction[ID];

        require(_transaction.isActive, Errors.COMPLETED());
        _transaction.numberOfApproval += 1;
        isApproved[ID][msg.sender] = true;
        uint count = _transaction.numberOfApproval;

        if (count >= MINIMUM) {
            payable(_transaction.spender).transfer(_transaction.Amount);
            balanceOf[_transaction.spender] += _transaction.Amount;
            _transaction.isActive = false;
        }
    }
    function sendTransaction(uint ID) private {
        Transaction storage _transaction = transaction[ID];
        balanceOf[_transaction.spender] += _transaction.Amount;
        payable(_transaction.spender).transfer(_transaction.Amount);
        _transaction.isActive = false;
    }

    function getTransaction(
        uint ID
    ) external view returns (Transaction memory) {
        return transaction[ID];
    }
    // function getAdmin(address _address) external view returns(bool){
    //     return isAdmin[_address];
    // };
    receive() external payable{}
}

