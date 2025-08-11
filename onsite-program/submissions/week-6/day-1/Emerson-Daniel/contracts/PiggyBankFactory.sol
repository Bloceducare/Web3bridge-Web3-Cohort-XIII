// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPiggyBank.sol";
import "./PiggyBank.sol";

/**
 * @title PiggyBankFactory
 * @dev Factory for creating and managing user piggy banks. Admin (deployer) receives fees.
 */
contract PiggyBankFactory is Ownable {
    // User => array of their piggy bank addresses
    mapping(address => address[]) public userPiggyBanks;
    // User => lock period => used (enforce unique locks per user)
    mapping(address => mapping(uint256 => bool)) private userLockPeriodsUsed;

    event PiggyBankCreated(address indexed user, address piggyBank, uint256 lockPeriod);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Creates a new piggy bank with a unique lock period for the caller.
     * @param lockPeriod Lock period in seconds (unique per user).
     */
    function createPiggyBank(uint256 lockPeriod) external {
        require(lockPeriod > 0, "Lock period must be > 0");
        require(!userLockPeriodsUsed[msg.sender][lockPeriod], "Unique lock period required");

        PiggyBank newPiggyBank = new PiggyBank(msg.sender, lockPeriod, owner());
        userPiggyBanks[msg.sender].push(address(newPiggyBank));
        userLockPeriodsUsed[msg.sender][lockPeriod] = true;

        emit PiggyBankCreated(msg.sender, address(newPiggyBank), lockPeriod);
    }

    /**
     * @dev Returns the number of piggy banks for a user.
     * @param user User address.
     * @return Count.
     */
    function getPiggyBankCount(address user) external view returns (uint256) {
        return userPiggyBanks[user].length;
    }

    /**
     * @dev Returns all piggy bank addresses for a user.
     * @param user User address.
     * @return Array of addresses.
     */
    function getUserPiggyBanks(address user) external view returns (address[] memory) {
        return userPiggyBanks[user];
    }

    /**
     * @dev Returns total balance for a specific token/ETH across all user piggy banks.
     * @param user User address.
     * @param token Token address (address(0) for ETH).
     * @return Total balance.
     */
    function getTotalBalance(address user, address token) external view returns (uint256) {
        uint256 total = 0;
        address[] memory banks = userPiggyBanks[user];
        for (uint256 i = 0; i < banks.length; i++) {
            IPiggyBank bank = IPiggyBank(banks[i]);
            total += bank.getBalance(token);
        }
        return total;
    }
}