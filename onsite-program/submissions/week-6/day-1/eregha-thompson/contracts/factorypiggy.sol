// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./piggybank.sol";

contract piggyFactory{
    address private admin;
    Savings_Account[] private publicAddress;
    constructor (){
        admin = msg.sender;
    }
    mapping (address => Savings_Account[]) private userAccounts;

    function createSavingsAccount(string memory _name, bool _isEther, uint _Locked_period, address _token_address) external returns(address) {
        require(_Locked_period >0, "invalid period");
        Savings_Account newAccount = new Savings_Account(_name, _isEther, _Locked_period* 1 hours, _token_address, admin, msg.sender);
    
    publicAddress.push(newAccount);
        userAccounts[msg.sender].push(newAccount);
        
        return address(newAccount);
    }

    function getUserAccounts(address owner) external view returns (Savings_Account[] memory){
        return userAccounts[owner];
    }

    function getAllAccounts() external view returns(Savings_Account[] memory) {
        return publicAddress;
    }
}
