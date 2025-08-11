// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./SavingsAccount.sol";

contract SavingsFactory {
    address public admin;
    mapping(address => address[]) private userAccounts;

    event AccountCreated(address indexed user, address accountAddress, address token, uint256 lockPeriod);

    constructor() {
        admin = msg.sender;
    }

    function createAccount(address token, uint256 lockPeriod) external payable returns (address) {
        SavingsAccount account = new SavingsAccount(msg.sender, token, lockPeriod, admin);
        address accountAddr = address(account);
        userAccounts[msg.sender].push(accountAddr);
        if (token == address(0) && msg.value > 0) {
            (bool ok,) = accountAddr.call{value: msg.value}(abi.encodeWithSignature("depositETH()"));
            require(ok, "deposit fail");
        }
        emit AccountCreated(msg.sender, accountAddr, token, lockPeriod);
        return accountAddr;
    }

    function getAccountCount(address user) external view returns (uint256) {
        return userAccounts[user].length;
    }

    function getAccounts(address user) external view returns (address[] memory) {
        return userAccounts[user];
    }

    function getUserTotalBalance(address user) external view returns (uint256 totalBalance) {
        address[] memory list = userAccounts[user];
        for (uint i = 0; i < list.length; i++) {
            totalBalance += SavingsAccount(list[i]).getBalance();
        }
    }
}