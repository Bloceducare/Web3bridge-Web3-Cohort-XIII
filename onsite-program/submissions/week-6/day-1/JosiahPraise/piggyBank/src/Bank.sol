// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Account} from "./Account.sol";
import {Type} from "./lib.sol";

contract Bank {
    address public immutable admin;
    mapping(address => address[]) public userToAccounts;
    address[] public allAccounts;

    error Bank__UserHasNoAccounts();
    error Bank__AccountNotFoundForUser();
    error Bank__ZeroAddressNotAllowed();

    event AccountCreated(
        address indexed owner, 
        address indexed accountAddress, 
        Type accountType, 
        uint256 lockPeriod
    );

    constructor() {
        admin = msg.sender;
    }

    function createAccount(
        Type accountType,
        uint256 lockPeriodInSeconds,
        address erc20Address
    ) external returns (address) {
        // this becomes the admin of every new account
        Account newAccount = new Account(admin, msg.sender, lockPeriodInSeconds, accountType, erc20Address);
        address accountAddress = address(newAccount);

        allAccounts.push(accountAddress);
        userToAccounts[msg.sender].push(accountAddress);

        emit AccountCreated(msg.sender, accountAddress, accountType, lockPeriodInSeconds);
        return accountAddress;
    }

    function getAccountsForUser(address user) external view returns (address[] memory) {
        return userToAccounts[user];
    }

 
    function getNumberOfAccountsForUser(address user) external view returns (uint256) {
        if (user == address(0)) revert Bank__ZeroAddressNotAllowed();
        return userToAccounts[user].length;
    }
}