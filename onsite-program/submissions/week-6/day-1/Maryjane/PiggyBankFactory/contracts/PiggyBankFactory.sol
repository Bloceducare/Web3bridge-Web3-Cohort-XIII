// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IPiggyBank.sol";
import "./PiggyBank.sol";

contract PiggyBankFactory {
    address public admin;
    mapping(address => address) public userPiggyBanks;

    event PiggyBankCreated(address indexed user, address piggyBank);

    constructor() {
        admin = msg.sender;
    }

    function createPiggyBank() external returns (address) {
        require(userPiggyBanks[msg.sender] == address(0), "Piggy Bank already exists");

        PiggyBank piggyBank = new PiggyBank(msg.sender, address(this));
        userPiggyBanks[msg.sender] = address(piggyBank);
        emit PiggyBankCreated(msg.sender, address(piggyBank));

        return address(piggyBank);
    }

    function getPiggyBank(address _user) external view returns (address) {
        return userPiggyBanks[_user];
    }

    function getSavingsAccountCount(address _user) external view returns (uint256) {
        address piggyBank = userPiggyBanks[_user];
        if (piggyBank == address(0)) {
            return 0;
        }
        return IPiggyBank(piggyBank).savingsAccountCount();
    }
}