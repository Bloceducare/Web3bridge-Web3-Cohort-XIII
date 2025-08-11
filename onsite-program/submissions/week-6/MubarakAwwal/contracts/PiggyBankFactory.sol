// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./piggybank.sol";
contract PiggyBankFactory {
    address public admin;
    mapping(address => address[]) public userAccounts;

    event PiggyBankCreated(address indexed user, address piggyBank, uint lockPeriod, address token);

    constructor() {
        admin = msg.sender;
    }

    function createPiggyBank(uint _lockPeriod, address _token) external {
        PiggyBank pb = new PiggyBank(msg.sender, admin, _lockPeriod, _token);
        userAccounts[msg.sender].push(address(pb));
        emit PiggyBankCreated(msg.sender, address(pb), _lockPeriod, _token);
    }

    function getUserPiggyBanks(address user) external view returns (address[] memory) {
        return userAccounts[user];
    }

    function getUserAccountCount(address user) external view returns (uint) {
        return userAccounts[user].length;
    }
}
