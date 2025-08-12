// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


import "./IPiggyBank.sol";
import "./PiggyBank.sol";

contract Factory {
    address public admin;
    mapping(address => address) public userContracts;
    mapping(address => mapping(uint256 => bool)) public lockTimes;

    event ContractCreated(address indexed user, address indexed Address);
    event lockTimeMarked(address indexed user, uint256 lockTime);

    constructor() {
        admin = msg.sender;
    }

    function createUserContract() external {
        require(userContracts[msg.sender] == address(0), "User already exists");
        PiggyBank child = new PiggyBank(msg.sender);
        userContracts[msg.sender] = address(child);
        emit ContractCreated(msg.sender, address(child));
    }

    function isLockTimeUsed(address user, uint256 lockTime) external view returns (bool) {
        return lockTimes[user][lockTime];
    }

    function markLockTimeUsed(address user, uint256 lockTime) external {
        require(msg.sender == userContracts[user], "Only child contract can mark");
        lockTimes[user][lockTime] = true;
        emit lockTimeMarked(user, lockTime);
    }

    function getUserTotalBalances(address user) external view returns (uint256 etherBalance, uint256 tokenBalance) {
        address childAddr = userContracts[user];
        require(childAddr != address(0), "User contract not found");
        return IPiggyBank(childAddr).getTotalBalances();
    }
}
