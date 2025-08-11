// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { PiggyToken } from "./ERC20Token.sol";

contract Piggy {
    address public owner;
    PiggyToken public token;

    struct User {
        string name;
        address users_address;
        uint256[] savings_amounts;
        uint256[] savings_duration;
    }

    User[] public users;

    mapping(address => uint256) userToTotalSavings;
    mapping(address => mapping(uint256 => uint256)) userToIndexToSavings;
    mapping(address => mapping(uint256 => uint256)) userToIndexToDurationofASaving;
    mapping(address => uint256) public addressToUserIndex;
    mapping(address => uint256[]) public userToStartTimes;

    constructor(address _tokenAddress) {
        owner = msg.sender;
        token = PiggyToken(_tokenAddress);
    }

    function registration(
        string memory _name, 
        address _users_address, 
        uint256[] memory _savings_amounts,
        uint256[] memory _savings_duration
        ) external {
            require(_savings_amounts.length == _savings_duration.length, "Arrays must have same length");

            users.push(User(
                _name,
                _users_address,
                _savings_amounts,
                _savings_duration
            ));
        // userToTotalSavings[msg.sender].savings_amounts += _savings_amounts[];

            uint256 total = 0;
            for (uint256 i = 0; i < _savings_amounts.length; i++) {
                total += _savings_amounts[i];
            }

            userToTotalSavings[_users_address] += total;
            addressToUserIndex[_users_address] = users.length -1;
    }

    function save(uint256 _savings_amounts, uint256 _duration) external {
        require(_savings_amounts > 0, "Amount must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");

        uint256 index = addressToUserIndex[msg.sender];

        bool success = token.transferFrom(msg.sender, address(this), _savings_amounts);
        require(success, "Transfer failed");

        userToTotalSavings[msg.sender] += _savings_amounts;

        users[index].savings_amounts.push(_savings_amounts);
        users[index].savings_duration.push(_duration);

        userToStartTimes[msg.sender].push(block.timestamp);
    }

    function withdrawSavings(address _users_address, uint256 index) external returns (uint256) {
        require(msg.sender == _users_address, "Only user can withdraw their savings");
        require(index < users.length, "Invalid user index");
        require(users[addressToUserIndex[_users_address]].users_address == _users_address, "Address mismatch");
        
        uint256 userIndex = addressToUserIndex[_users_address];
        require(index < users[userIndex].savings_amounts.length, "Invalid savings index");
        
        uint256 savingAmount = users[userIndex].savings_amounts[index];
        uint256 savingDuration = users[userIndex].savings_duration[index];
        uint256 startTime = userToStartTimes[_users_address][index];
        
        require(savingAmount > 0, "No savings to withdraw");
        
        uint256 withdrawal;
        
        // Check if the duration has passed
        if (block.timestamp >= startTime + (savingDuration * 1 days)) {
            // Duration completed - full withdrawal
            withdrawal = savingAmount;
        } else {
            
            uint256 penalty = (savingAmount * 0) / 100; 
            withdrawal = savingAmount - penalty;


            token.transfer(owner, penalty);
            require(token.transfer(owner, penalty), "Penalty transfer failed");
        }
        
        bool success = token.transfer(_users_address, withdrawal);
        require(success, "Transfer failed");
        
        userToTotalSavings[_users_address] -= savingAmount;
        
        uint256 lastIndex = users[userIndex].savings_amounts.length - 1;
        users[userIndex].savings_amounts[index] = users[userIndex].savings_amounts[lastIndex];
        users[userIndex].savings_duration[index] = users[userIndex].savings_duration[lastIndex];
        userToStartTimes[_users_address][index] = userToStartTimes[_users_address][lastIndex];
        
        users[userIndex].savings_amounts.pop();
        users[userIndex].savings_duration.pop();
        userToStartTimes[_users_address].pop();
        
        return withdrawal;
    }


    function getUserTotalSavings (address _user) external view returns (uint256) {
        return userToTotalSavings[_user];
    }

}