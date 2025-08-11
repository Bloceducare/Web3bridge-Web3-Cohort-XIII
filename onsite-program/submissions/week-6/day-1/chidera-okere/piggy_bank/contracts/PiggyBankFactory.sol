// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./PiggyBank.sol";

contract PiggyBankFactory {
    address public admin;
    mapping(address => address) public userToPiggyBank;
    address[] public allPiggyBanks;

    constructor() {
        admin = msg.sender;
    }

    function createPiggyBank() external {
        require(userToPiggyBank[msg.sender] == address(0), "Already has a piggybank");

        PiggyBank newPiggybank = new PiggyBank(msg.sender, address(this));
        userToPiggyBank[msg.sender] = address(newPiggybank);
        allPiggyBanks.push(address(newPiggybank));
    }

    function getUserPiggyBank(address user) external view returns (address) {
        return userToPiggyBank[user];
    }

    function getTotalPiggyBanks() external view returns (uint256) {
        return allPiggyBanks.length;
    }
}
