// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./PiggyBank.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PiggyBankFactory is Ownable {
    mapping(address => address[]) public userPiggyBanks;
    mapping(address => uint256) public userSavingsCount;

    event PiggyBankCreated(address indexed user, address piggyBank);

    error PiggyBankAlreadyExists();

    constructor() Ownable(msg.sender) {}

    function createPiggyBank() external {
        if (userPiggyBanks[msg.sender].length > 0) revert PiggyBankAlreadyExists();
        PiggyBank piggyBank = new PiggyBank(owner(), msg.sender); // Use factory owner as admin, user as owner
        userPiggyBanks[msg.sender].push(address(piggyBank));
        userSavingsCount[msg.sender]++;
        emit PiggyBankCreated(msg.sender, address(piggyBank));
    }

    function getUserPiggyBanks(address user) external view returns (address[] memory) {
        return userPiggyBanks[user];
    }
}