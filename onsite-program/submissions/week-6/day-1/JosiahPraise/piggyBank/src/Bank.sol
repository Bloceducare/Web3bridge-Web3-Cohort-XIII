//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Account} from "src/Account.sol";
import {Type} from "src/lib.sol";
import {Account} from "src/Account.sol";

contract Bank {
    address public admin;
    address[] public accounts;

    mapping(address => address[]) public userAccounts;


    error Bank__UnAuthorized();

    event AccountCreated(address indexed owner, uint256 lockPeriod, Type accountType);


    modifier onlyAdmin {
        if (msg.sender != admin) {
            revert Bank__UnAuthorized();
        }
        _;
    }


    constructor() {
        admin = msg.sender;
    }

    function createAccount(Type accountType, uint256 lockPeriod, address erc20Address) external returns (address) {
        // deploy account
        // add to array of accounts
        // add to userAccountsMap

        // this contract will be the admin of every account created
        Account newAccount = new Account(address(this), admin, msg.sender, lockPeriod, accountType, erc20Address);
        address accountAddress = address(newAccount);

        accounts.push(accountAddress);
        userAccounts[msg.sender].push(accountAddress);

        emit AccountCreated(msg.sender, lockPeriod, accountType);

        return accountAddress;
    }

    function getUserBalance(address user, address account) external onlyAdmin view returns (uint256 balance) {
        if (user == address(0)) {
            revert("ZeroAddressError");
        }

        if (userAccounts[user].length == 0) {
            revert("UserNotFound");
        }

        address[] memory accounts_ = userAccounts[user];

        for (uint256 i; i < accounts_.length; ++i) {
            if (accounts_[i] == account) {
                Account accountContract = Account(account);
                return accountContract.getBalance();
            }
        }

        revert("AccountNotFound");
    }

    function getNumberAccounts(address user) external view onlyAdmin returns (uint256 noOfAccounts) {
        if (user == address(0)) {
            revert("ZeroAddressError");
        }

        if (userAccounts[user].length == 0) {
            revert("UserNotFound");
        }

        return userAccounts[user].length;
    }
}
