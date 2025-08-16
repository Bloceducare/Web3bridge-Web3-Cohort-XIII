// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Multisig {

  // list of address that needs to sign
  address[] owners;
  address owner;

  // keep track of transactionCount
  uint8 transactionCount;

  //
  uint required;


  // A struct to hold information persistent to a transaction
  struct Transaction {
    address payable to;
    uint value;
    bool executed;
  }

  //map a number to a transaction
  mapping(uint => Transaction) transactions;
  
  // a 2d mapping that maps a number to an address that returns true/false
  mapping(uint => mapping(address => bool)) confirmations;

  // intialize the signers addresses and the number of signature needed
  constructor(address[] memory _owners, uint _confirmations, address _owner) {
    require(_owners.length > 0, "Owners needs to be greater than 0");
    require(_confirmations > 0, "You need the number of confirmation specified");
    require(_confirmations <= _owners.length, "You signers can't be more than owners");

    owner = _owner;
    owners = _owners;
    required = _confirmations;

  }

  //function to get owners
  function get_owners() external view returns (address[] memory) {
    return owners;
  }

  function get_confirmation() external view returns (uint) {
    return required;
  }

  //function that send ether to the address if all signers signed the transaction
  function executeTransaction(uint transactionId) external {
    require(this.isConfirmed(transactionId), "You need more confirmations");
    Transaction storage _tx = transactions[transactionId];
    (bool success, ) = _tx.to.call{value: _tx.value}("");
    require(success, "Tranfer failed");
    _tx.executed = true;

  }


  //A function that returns true or false if the owner is in the 2d mapping;
  function isConfirmed(uint transactionId) external view returns (bool) {
    return this.getConfirmationsCount(transactionId) >= required;
  }


  //A function that returns transactionCount
  function get_transaction_count() external view returns (uint8) {
    return transactionCount;
  }


    //A function to check if all owner has signed the transaction;
  function getConfirmationsCount(uint transactionId) external view returns (uint) {
    uint count;
    
    for(uint i; i < owners.length; i++) {
      if(confirmations[transactionId][owners[i]]) {
        return count++;
      }
    }

    return count;
  }

  // A function that adds a transaction to the list of transactions
  function submitTransaction(address payable _to, uint _value) external {
    uint id = this.addTransaction(_to, _value);
    this.confirmTransaction(id);
  
  }



  // A function that calls the transfer function if one of the owner calls it
  function confirmTransaction(uint transactionId) external onlyOwner(msg.sender) {
    confirmations[transactionId][msg.sender] = true;

    if(this.isConfirmed(transactionId)) {

      this.executeTransaction(transactionId);

    }

  }

  // A function to add transaction to the transaction list
  function addTransaction(address payable _to, uint value) external returns (uint) {

    transactions[transactionCount] = Transaction(_to, value, false);
    transactionCount += 1;

    return transactionCount - 1;
  }


 // A modifier that makes sure some conditions is passed
  modifier onlyOwner(address addr) {
    
    for (uint i; i < owners.length; i++) {
      require(owners[i] == addr, "Only Owner can confirm a transaction");
        
        _;
      }

  }


  //allows the contract to receive ethers

  receive() external payable {}

  fallback() external payable {}
}
