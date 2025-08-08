// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;


contract MultiSig {
    struct Transactions{
        uint256 transactionId;
        address payable recipient;
        uint256 amount;
        bool executed;
    }

    address [] owners;
    uint256 public uuid;
    uint256 required;
    mapping(uint256 => Transactions) transactions;
    mapping(uint256 => mapping(address => bool)) confirmations;
    mapping(address => bool) isOwner;


    constructor(address [] memory _owners, uint256 _confirmations){
        require(_owners.length > 0);
        require(_confirmations > 0);
        require(_confirmations <= _owners.length);
        required = _confirmations;

        for(uint256 i; i < _owners.length;i++){
            isOwner[_owners[i]] = true;
            owners.push(_owners[i]);
        }

    }

      receive() payable external {
        
    }


    function requestTransaction(address payable _recipient,uint256 _amount)external returns(uint256){
        Transactions memory new_transactions;
        new_transactions.transactionId = uuid;
        new_transactions.recipient = _recipient;
        new_transactions.amount = _amount;
        new_transactions.executed = false;
        transactions[new_transactions.transactionId] = new_transactions;
        uuid = uuid + 1; 
        return new_transactions.transactionId;

 }


     modifier onlyOwner(){
       require(isOwner[msg.sender],"Not_Authorized");
      _;
 }



    function confirmTransaction(uint256 transactionId)external onlyOwner{
         confirmations[transactionId][msg.sender] = true;
         if(isConfirmed(transactionId)){
            executeTransaction(transactionId);
         }
    }

    function executeTransaction(uint256 transactionId)internal {
       Transactions storage transaction = transactions[transactionId];
       transaction.recipient.transfer(transaction.amount);
       transaction.executed = true;
       
    }

     function isConfirmed (uint256 transactionId) internal view returns(bool){
           return getConfirmationCount(transactionId) >= required;
     }

     


     function getConfirmationCount(uint256 transactionId) internal view returns(uint256){
        uint256 count;
        for(uint256 i; i < owners.length; i++){
            if(confirmations[transactionId][owners[i]]){
                count++;
            }
        }
        return  count;
     }

       function getTransaction(uint256 transactionId) public view returns (Transactions memory) {
        Transactions memory transaction = transactions[transactionId];
        return transaction;
    }


}
        