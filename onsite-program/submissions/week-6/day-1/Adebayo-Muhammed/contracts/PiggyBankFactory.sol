// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Piggybank.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PiggyBankFactory is Ownable {
    struct UserInfo {
        address piggyBankAddress;
        uint256 accountsCount;
        bool exists;
    }
    
    mapping(address => UserInfo) public users;
    address[] public allUsers;
    uint256 public totalUsers;
    
    event PiggyBankCreated(address indexed user, address indexed piggyBankAddress);
    event UserJoined(address indexed user);
    
    constructor() Ownable(msg.sender) {}
    
    function join() external {
        require(!users[msg.sender].exists, "User already has a piggy bank");

        PiggyBank newPiggyBank = new PiggyBank(msg.sender, owner());
        
        users[msg.sender] = UserInfo({
            piggyBankAddress: address(newPiggyBank),
            accountsCount: 0,
            exists: true
        });
        
        allUsers.push(msg.sender);
        totalUsers++;
        
        emit PiggyBankCreated(msg.sender, address(newPiggyBank));
        emit UserJoined(msg.sender);
    }

    function getUserAccountBalance(address user, uint256 accountId) external view returns (uint256) {
        require(users[user].exists, "User doesn't have a piggy bank");
        PiggyBank piggyBank = PiggyBank(users[user].piggyBankAddress);
        return piggyBank.getAccountBalance(accountId);
    }
}