// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "./PiggyBank.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PiggyBankFactory is Ownable {
    
    mapping(address => address[]) public userAccounts;

    event PiggyAccountCreated(address indexed user, address piggyAccount);

    constructor() Ownable(msg.sender) {}

    function create_Piggy_Account() external {
       
        PiggyBank account = new PiggyBank(msg.sender, owner());
        userAccounts[msg.sender].push(address(account));

        emit PiggyAccountCreated(msg.sender, address(account));
    }

    function getUserAccounts(address _user) external view returns (address[] memory) {
        return userAccounts[_user];
    }
    // https://sepolia-blockscout.lisk.com/address/0xCC41dD570aF4A2Fd0c769D652405eF7AC25A8c8A#code
}