// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./PiggyBank.sol";
import "./IERC20.sol";

/**
 * @title PiggyBankFactory
 * @dev Factory contract to deploy and manage multiple piggy bank instances
 * @author Allan Kamau - Web3bridge Week 6 Assignment
 */
contract PiggyBankFactory {
    // State variables
    address public immutable admin;
    uint256 public totalPiggyBanks;
    
    // Mappings
    mapping(address => address[]) public userPiggyBanks;
    mapping(address => uint256) public userPiggyBankCount;
    address[] public allPiggyBanks;

    // Events
    event PiggyBankCreated(
        address indexed user,
        address indexed piggyBank,
        address indexed token,
        uint256 lockPeriod,
        uint256 timestamp
    );
    event PenaltyCollected(
        address indexed piggyBank,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    // Errors
    error OnlyAdmin();
    error InvalidLockPeriod();
    error TransferFailed();
    error InvalidToken();

    /**
     * @dev Constructor sets the deployer as admin
     */
    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Modifier to restrict access to admin only
     */
    modifier onlyAdmin() {
        if (msg.sender != admin) revert OnlyAdmin();
        _;
    }

    /**
     * @dev Create a new ETH piggy bank
     * @param lockPeriod Lock period in seconds (must be > 0)
     * @return piggyBank Address of the created piggy bank
     */
    function createETHPiggyBank(uint256 lockPeriod) external returns (address piggyBank) {
        if (lockPeriod == 0) revert InvalidLockPeriod();

        // Deploy new PiggyBank contract
        piggyBank = address(new PiggyBank(
            msg.sender,
            address(this),
            address(0), // ETH
            lockPeriod
        ));

        // Update mappings and counters
        userPiggyBanks[msg.sender].push(piggyBank);
        userPiggyBankCount[msg.sender]++;
        allPiggyBanks.push(piggyBank);
        totalPiggyBanks++;

        emit PiggyBankCreated(
            msg.sender,
            piggyBank,
            address(0),
            lockPeriod,
            block.timestamp
        );

        return piggyBank;
    }

    /**
     * @dev Create a new ERC20 token piggy bank
     * @param token ERC20 token address
     * @param lockPeriod Lock period in seconds (must be > 0)
     * @return piggyBank Address of the created piggy bank
     */
    function createTokenPiggyBank(
        address token,
        uint256 lockPeriod
    ) external returns (address piggyBank) {
        if (lockPeriod == 0) revert InvalidLockPeriod();
        if (token == address(0)) revert InvalidToken();

        // Deploy new PiggyBank contract
        piggyBank = address(new PiggyBank(
            msg.sender,
            address(this),
            token,
            lockPeriod
        ));

        // Update mappings and counters
        userPiggyBanks[msg.sender].push(piggyBank);
        userPiggyBankCount[msg.sender]++;
        allPiggyBanks.push(piggyBank);
        totalPiggyBanks++;

        emit PiggyBankCreated(
            msg.sender,
            piggyBank,
            token,
            lockPeriod,
            block.timestamp
        );

        return piggyBank;
    }

    /**
     * @dev Get all piggy banks created by a user
     * @param user User address
     * @return Array of piggy bank addresses
     */
    function getUserPiggyBanks(address user) external view returns (address[] memory) {
        return userPiggyBanks[user];
    }

    /**
     * @dev Get total balance across all user's piggy banks (ETH only)
     * @param user User address
     * @return totalBalance Total ETH balance across all user's piggy banks
     */
    function getUserTotalETHBalance(address user) external view returns (uint256 totalBalance) {
        address[] memory banks = userPiggyBanks[user];
        
        for (uint256 i = 0; i < banks.length; i++) {
            PiggyBank bank = PiggyBank(payable(banks[i]));
            if (bank.isEthBank()) {
                totalBalance += bank.getBalance();
            }
        }
        
        return totalBalance;
    }

    /**
     * @dev Get total balance across all user's piggy banks for a specific token
     * @param user User address
     * @param token Token address
     * @return totalBalance Total token balance across all user's piggy banks
     */
    function getUserTotalTokenBalance(
        address user,
        address token
    ) external view returns (uint256 totalBalance) {
        if (token == address(0)) revert InvalidToken();
        
        address[] memory banks = userPiggyBanks[user];
        
        for (uint256 i = 0; i < banks.length; i++) {
            PiggyBank bank = PiggyBank(payable(banks[i]));
            if (bank.token() == token) {
                totalBalance += bank.getBalance();
            }
        }
        
        return totalBalance;
    }

    /**
     * @dev Get detailed information about all user's piggy banks
     * @param user User address
     * @return banks Array of piggy bank addresses
     * @return tokens Array of token addresses (address(0) for ETH)
     * @return balances Array of current balances
     * @return lockPeriods Array of lock periods
     * @return isLocked Array indicating if each bank is still locked
     */
    function getUserPiggyBankDetails(address user) external view returns (
        address[] memory banks,
        address[] memory tokens,
        uint256[] memory balances,
        uint256[] memory lockPeriods,
        bool[] memory isLocked
    ) {
        banks = userPiggyBanks[user];
        uint256 length = banks.length;
        
        tokens = new address[](length);
        balances = new uint256[](length);
        lockPeriods = new uint256[](length);
        isLocked = new bool[](length);
        
        for (uint256 i = 0; i < length; i++) {
            PiggyBank bank = PiggyBank(payable(banks[i]));
            (
                ,
                address token,
                uint256 lockPeriod,
                uint256 createdAt,
                uint256 balance,
                bool locked
            ) = bank.getPiggyBankInfo();
            
            tokens[i] = token;
            balances[i] = balance;
            lockPeriods[i] = lockPeriod;
            isLocked[i] = locked;
        }
        
        return (banks, tokens, balances, lockPeriods, isLocked);
    }

    /**
     * @dev Get factory statistics
     * @return totalBanks Total number of piggy banks created
     * @return totalUsers Total number of unique users
     * @return adminAddress Admin address
     */
    function getFactoryStats() external view returns (
        uint256 totalBanks,
        uint256 totalUsers,
        address adminAddress
    ) {
        // Count unique users (simplified - in production, you'd track this more efficiently)
        uint256 uniqueUsers = 0;
        for (uint256 i = 0; i < allPiggyBanks.length; i++) {
            address owner = PiggyBank(payable(allPiggyBanks[i])).owner();
            bool isUnique = true;
            
            // Check if we've seen this owner before
            for (uint256 j = 0; j < i; j++) {
                if (PiggyBank(payable(allPiggyBanks[j])).owner() == owner) {
                    isUnique = false;
                    break;
                }
            }
            
            if (isUnique) {
                uniqueUsers++;
            }
        }
        
        return (totalPiggyBanks, uniqueUsers, admin);
    }

    /**
     * @dev Admin function to withdraw collected penalty fees (ETH)
     * @param amount Amount to withdraw
     */
    function withdrawPenaltyETH(uint256 amount) external onlyAdmin {
        if (amount > address(this).balance) revert TransferFailed();
        
        (bool success, ) = payable(admin).call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @dev Admin function to withdraw collected penalty fees (ERC20 tokens)
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function withdrawPenaltyToken(address token, uint256 amount) external onlyAdmin {
        if (token == address(0)) revert InvalidToken();
        
        IERC20 tokenContract = IERC20(token);
        bool success = tokenContract.transfer(admin, amount);
        if (!success) revert TransferFailed();
    }

    /**
     * @dev Get penalty balance for ETH
     * @return ETH balance held by factory
     */
    function getPenaltyETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get penalty balance for a specific token
     * @param token Token address
     * @return Token balance held by factory
     */
    function getPenaltyTokenBalance(address token) external view returns (uint256) {
        if (token == address(0)) revert InvalidToken();
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @dev Receive function to accept ETH penalty payments
     */
    receive() external payable {
        emit PenaltyCollected(msg.sender, address(0), msg.value, block.timestamp);
    }
}
