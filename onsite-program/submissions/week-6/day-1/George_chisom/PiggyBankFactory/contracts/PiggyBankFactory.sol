// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./PiggyBank.sol";

contract ChildFactory {
    
    address public immutable admin;

    
    mapping(address => address[]) public userPiggyBanks;


    event PiggyBankCreated(address indexed user, address piggyBank);

    constructor() {
        admin = msg.sender;
    }

    // Deploy a new PiggyBank contract for a user
    function createPiggyBank() external returns (address) {
    
        PiggyBank newPiggyBank = new PiggyBank();
        
        
        userPiggyBanks[msg.sender].push(address(newPiggyBank));

        emit PiggyBankCreated(msg.sender, address(newPiggyBank));

        return address(newPiggyBank);
    }
    

    // Get all PiggyBank contracts for a user
    function getUserPiggyBanks(address _user) external view returns (address[] memory) {
        return userPiggyBanks[_user];
    }

    // Get the number of PiggyBank contracts for a user
    function getUserPiggyBankCount(address _user) external view returns (uint256) {
        return userPiggyBanks[_user].length;
    }
}