// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

error NOT_ENOUGH_SIGNERS();
error NOT_ENOUGH_REQUIRED_SIGNERS();
error TOO_MUCH_SIGNER();
error NOT_OWNER();
error INVALID_TRANSACTION_ID();
error TRANSACTION_ALREADY_EXECUTED();
error TRANSACTION_ALREADY_SIGNED();
error TRANSACTION_FAILED();


contract MultiSig {
    mapping(address => bool) signers;
    mapping(uint256 => mapping(address => bool)) isConfirmed;
    mapping(uint256 => Transaction) transactions;
    // mapping(uint256 => uint256) numberOfSignature;
    uint256 noOfRequiredSigners;
    uint256 transactionId;

    address [] signersAddresses;


    struct Transaction {
        uint256 amount;
        uint256 id;
        address payable recipient;
        bool executed;
        uint256 numberOfSignature;
    }

    constructor(address[] memory _signersAddresses, uint256 _noOfRequiredSigners) {
        require(_signersAddresses.length > 1, NOT_ENOUGH_SIGNERS());
        require(_noOfRequiredSigners > 1, NOT_ENOUGH_REQUIRED_SIGNERS());
        require(_noOfRequiredSigners <= _signersAddresses.length, TOO_MUCH_SIGNER());
        signersAddresses = _signersAddresses;

        for (uint256 i; i < _signersAddresses.length; i++) {
            signers[_signersAddresses[i]] = true;
            
        }

        noOfRequiredSigners = _noOfRequiredSigners;
    }

    function proposeTransaction(address payable _to, uint256 _amount) external owners(msg.sender) returns (uint256) {
       
        Transaction memory newTransaction;
        newTransaction.amount = _amount;
        newTransaction.recipient = _to;
        newTransaction.id = transactionId++;

        transactions[newTransaction.id] = newTransaction;

        isConfirmed[newTransaction.id][msg.sender] = true;
        transactions[newTransaction.id].numberOfSignature++;

        // numberOfSignature[newTransaction.id] = 1;

        return newTransaction.id;
    }

    function signTransaction(uint256 _transactionId) external owners(msg.sender){
        require(transactions[_transactionId].recipient != address(0),INVALID_TRANSACTION_ID());
        require(transactions[_transactionId].executed == false, TRANSACTION_ALREADY_EXECUTED());
        require(isConfirmed[_transactionId][msg.sender] == false, TRANSACTION_ALREADY_SIGNED());        

        Transaction storage fetchedTransaction = transactions[_transactionId];
       fetchedTransaction.numberOfSignature ++;
        isConfirmed[_transactionId][msg.sender] = true;


        if ( fetchedTransaction.numberOfSignature == noOfRequiredSigners) {
            executeTransaction(fetchedTransaction);
            
        }
        
    }

    function executeTransaction( Transaction storage transaction) private {
    // Transaction storage transaction = transactions[_transactionId];

    require(transaction.executed ==  false, TRANSACTION_ALREADY_EXECUTED());
    require(transaction.numberOfSignature >= noOfRequiredSigners, NOT_ENOUGH_SIGNERS());

    transaction.executed = true;

    (bool success, ) = transaction.recipient.call{value: transaction.amount}("");
    require(success,  TRANSACTION_FAILED());

}

    // function increaseMember (address _memberAddress) external owners(msg.sender) {
    //     require(_memberAddress != address(0),INVALID_TRANSACTION_ID());
    //     signers[_memberAddress] = true;
    //     signersAddresses.push(_memberAddress);


    // }

    function changeNoOfRequiredSigners(uint256 _number) external owners(msg.sender){
        require(_number > 1, NOT_ENOUGH_REQUIRED_SIGNERS());
        require(_number <= signersAddresses.length, TOO_MUCH_SIGNER());
        noOfRequiredSigners = _number;

    } 

    function getSignersAddresses () external  view owners(msg.sender) returns(address [] memory) {
        return signersAddresses;
    }

    function getOfRequiredSigners () external view  owners(msg.sender) returns (uint256){
        return noOfRequiredSigners;
    }

    receive() external payable { }  

    fallback() external payable { } 




    modifier owners(address senderAddress) {
        require(signers[senderAddress], NOT_OWNER());
        _;
    }
}
