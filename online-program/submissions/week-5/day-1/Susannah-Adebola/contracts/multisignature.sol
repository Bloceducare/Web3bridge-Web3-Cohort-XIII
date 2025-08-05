// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Wallet {
   //state variables 

   struct Transaction{
        address to;
        uint value;
        bytes data;
        bool executed;
        uint numConfirmations;
   }
   Transaction[] public transactions;
   mapping(uint => mapping(address => bool)) public isConfirmed;
   address[] public owners;
   mapping(address => bool) public isOwner;
   uint public numConfirmationsRequired;

   modifier onlyOwner() {
       require(isOwner[msg.sender], "Only owner can make decision");
       _;
   }
   modifier txExists(uint _txId) {
       require(_txId < transactions.length, "transaction does not exist");
       _;
   }

   modifier notExecuted(uint _txId) {
       require(!transactions[_txId].executed, "transaction already executed");
       _;
   }

   modifier notConfirmed(uint _txId) {
       require(!isConfirmed[_txId][msg.sender], "transaction already confirmed");
       _;
   }

    //events emitted:-

    event TransactionSubmitted(uint256 indexed txId, address indexed to, uint256 value);
    event TransactionConfirmed(uint256 indexed txId, address indexed owner);
    event TransactionRevoked(uint256 indexed txId, address indexed owner);
    event TransactionExecuted(uint256 indexed txId);
      constructor(address[] memory _owners, uint _numConfirmationsRequired) {
       require(_owners.length > 1, "multiple owners are required");
       require(
           _numConfirmationsRequired > 1 && _numConfirmationsRequired <= _owners.length,
           "invalid number of required confirmations"
       );

       for (uint i = 0; i < _owners.length; i++) {
           address owner = _owners[i];

           require(owner != address(0), "zero address is not valid");

           isOwner[owner] = true;
           owners.push(owner);
       }

       numConfirmationsRequired = _numConfirmationsRequired;
   }

   receive() external payable {}
   //functions 
    function submit(address _to, uint _value, bytes memory _data)public onlyOwner{
         uint256 txId = transactions.length;
         transactions.push(
            Transaction({
               to: _to,
               value: _value,
               data: _data,
               executed: false,
               numConfirmations: 0
            })
         );
         emit TransactionSubmitted(txId, _to, _value);
    }
    function confirmTransaction(uint _txId) public onlyOwner txExists(_txId) notExecuted(_txId) notConfirmed(_txId) {
        Transaction storage transaction = transactions[_txId];
        transaction.numConfirmations += 1;
        isConfirmed[_txId][msg.sender] = true;

        emit TransactionConfirmed(_txId, msg.sender );
        }
    function revokeConfirmation( uint _txId) public onlyOwner txExists(_txId) notExecuted(_txId) {
       Transaction storage transaction = transactions[_txId];

       require(isConfirmed[_txId][msg.sender], "transaction not confirmed");

       transaction.numConfirmations -= 1;
       isConfirmed[_txId][msg.sender] = false;

       emit TransactionRevoked(  _txId, msg.sender);

    }
    function executeTransaction( uint _txId)public onlyOwner txExists(_txId) notExecuted(_txId) {
       Transaction storage transaction = transactions[_txId];

       require(
           transaction.numConfirmations >= numConfirmationsRequired,
           "cannot execute tx"
       );

       transaction.executed = true;

       (bool success, ) = transaction.to.call{value: transaction.value}(
           transaction.data   );
       require(success, "tx failed");

       emit TransactionExecuted(_txId);
     }
    }
      
      
   

