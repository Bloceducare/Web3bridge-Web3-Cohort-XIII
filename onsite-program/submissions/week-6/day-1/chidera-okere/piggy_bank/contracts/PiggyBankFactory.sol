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


    function createPiggyBank() external returns (address) {
        require(userToPiggyBank[msg.sender] == address(0), "Already has piggybank");
        PiggyBank piggybank = new PiggyBank(msg.sender, address(this));
        userToPiggyBank[msg.sender] = address(piggybank);
        allPiggyBanks.push(address(piggybank));
        return address(piggybank);
    }

    function getUserPiggyBank(address user) external view returns (address) {
        return userToPiggyBank[user];
    }

    function getTotalPiggyBanks() external view returns (uint256) {
        return allPiggyBanks.length;
    }

    function getUserSavingsCount(address user) external view returns (uint256) {
    address piggyBankAddress = userToPiggyBank[user];
    if (piggyBankAddress == address(0)) return 0;
    
    return PiggyBank(payable(piggyBankAddress)).getUserActivePlansCount(user);
}

function getUserBalance(address user) external view returns (uint256 ethBalance, uint256[] memory tokenBalances, address[] memory tokens) {
    address piggyBankAddress = userToPiggyBank[user];
    require(piggyBankAddress != address(0), "User has no piggy bank");
    
    return PiggyBank(payable(piggyBankAddress)).getUserTotalBalance(user);
}
}
