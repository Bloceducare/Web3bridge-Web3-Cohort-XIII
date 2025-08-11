// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./PiggyBank.sol";

contract PiggyBankFactory {
    address public admin;
    mapping(address => address[]) public userPiggyBanks;
    address[] public allPiggyBanks;

    event PiggyBankCreated(address indexed user, address piggyBank);

    constructor() {
        admin = msg.sender;
    }

    function createPiggyBank() external returns (address) {
        PiggyBank piggyBank = new PiggyBank(msg.sender, admin);
        userPiggyBanks[msg.sender].push(address(piggyBank));
        allPiggyBanks.push(address(piggyBank));
        emit PiggyBankCreated(msg.sender, address(piggyBank));
        return address(piggyBank);
    }

    function getUserPiggyBanks(address user) external view returns (address[] memory) {
        return userPiggyBanks[user];
    }

    function getAllPiggyBanks() external view returns (address[] memory) {
        return allPiggyBanks;
    }
}
