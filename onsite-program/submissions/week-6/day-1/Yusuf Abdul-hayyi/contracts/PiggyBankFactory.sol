// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PiggyBank.sol";


contract PiggyBankFactory {
    address public admin; 
    address[] public allAccounts;

    mapping(address => address[]) public userAccounts;

    event AccountCreated(address indexed owner, address indexed accountAddress, string name, address token);

    constructor() {
        admin = msg.sender;
    }

    
    function createAccount(string calldata _name, address _token) external returns (address accountAddress) {
        PiggyBank child = new PiggyBank(msg.sender, admin, _name, _token);
        accountAddress = address(child);

        allAccounts.push(accountAddress);
        userAccounts[msg.sender].push(accountAddress);

        emit AccountCreated(msg.sender, accountAddress, _name, _token);
    }

    function getUserAccountCount(address user) external view returns (uint256) {
        return userAccounts[user].length;
    }

    function getUserAccounts(address user) external view returns (address[] memory) {
        return userAccounts[user];
    }

    function getAllAccounts() external view returns (address[] memory) {
        return allAccounts;
    }

  
    // function getUserAggregatedBalance(address user, address tokenAddress) external view returns (uint256 total) {
    //     address[] memory accountsArr = userAccounts[user];
    //     for (uint256 i = 0; i < accountsArr.length; i++) {
    //         address acc = accountsArr[i];
    //         PiggyBank child = PiggyBank(payable(acc));
            
    //         if (PiggyBank(acc).token() == tokenAddress) {
    //             total += PiggyBank(acc).getBalance();
    //         }
    //     }
    // }
}
