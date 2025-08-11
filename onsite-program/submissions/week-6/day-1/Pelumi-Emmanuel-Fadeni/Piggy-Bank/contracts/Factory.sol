// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Piggybank.sol";

contract Factory {
    address public admin;

    mapping(address => address[]) public userAccounts; 

    constructor() {
        admin = msg.sender;
    }

     // Create a new savings account
    function createSavingsAccount(address _tokenAddress, uint256 _lockDuration) external {
        require(_lockDuration > 0, "Lock duration must be > 0");

        // Deploy a new SavingsAccount contract
        SavingsAccount newAccount = new SavingsAccount(
            msg.sender,       // owner of this new account
            _tokenAddress,    // token or ETH
            _lockDuration,    // lock duration
            address(this),    // the factory's address
            admin              // factory admin address
        );

        // Save it in the mapping
        userAccounts[msg.sender].push(address(newAccount));
    }

     // Get all savings accounts for a user
    function getUserAccounts(address _user) external view returns (address[] memory) {
        return userAccounts[_user];
    }
}



