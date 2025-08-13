// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IERC20.sol";

/**
 * @title PiggyBank
 * @dev Individual savings account contract supporting ETH and ERC20 tokens
 * @author Allan Kamau - Web3bridge Week 6 Assignment
 */
contract PiggyBank {
    // State variables
    address public immutable owner;
    address public immutable factory;
    address public immutable token; // address(0) for ETH, token address for ERC20
    uint256 public immutable lockPeriod;
    uint256 public immutable createdAt;
    uint256 public totalDeposits;
    bool public isEthBank;

    // Constants
    uint256 public constant PENALTY_RATE = 3; // 3% penalty for early withdrawal
    uint256 public constant PERCENTAGE_BASE = 100;

    // Events
    event Deposit(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed user, uint256 amount, uint256 penalty, uint256 timestamp);
    event EmergencyWithdrawal(address indexed user, uint256 amount, uint256 penalty, uint256 timestamp);

    // Errors
    error OnlyOwner();
    error OnlyFactory();
    error InvalidAmount();
    error InsufficientBalance();
    error LockPeriodNotExpired();
    error TransferFailed();
    error InvalidToken();

    /**
     * @dev Constructor to initialize the piggy bank
     * @param _owner The owner of this piggy bank
     * @param _factory The factory contract address
     * @param _token Token address (address(0) for ETH)
     * @param _lockPeriod Lock period in seconds
     */
    constructor(
        address _owner,
        address _factory,
        address _token,
        uint256 _lockPeriod
    ) {
        owner = _owner;
        factory = _factory;
        token = _token;
        lockPeriod = _lockPeriod;
        createdAt = block.timestamp;
        isEthBank = (_token == address(0));
    }

    /**
     * @dev Modifier to restrict access to owner only
     */
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    /**
     * @dev Modifier to restrict access to factory only
     */
    modifier onlyFactory() {
        if (msg.sender != factory) revert OnlyFactory();
        _;
    }

    /**
     * @dev Deposit ETH to the piggy bank
     */
    function depositETH() external payable onlyOwner {
        if (!isEthBank) revert InvalidToken();
        if (msg.value == 0) revert InvalidAmount();

        totalDeposits += msg.value;
        emit Deposit(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Deposit ERC20 tokens to the piggy bank
     * @param amount Amount of tokens to deposit
     */
    function depositToken(uint256 amount) external onlyOwner {
        if (isEthBank) revert InvalidToken();
        if (amount == 0) revert InvalidAmount();

        IERC20 tokenContract = IERC20(token);
        bool success = tokenContract.transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();

        totalDeposits += amount;
        emit Deposit(msg.sender, amount, block.timestamp);
    }

    /**
     * @dev Withdraw funds after lock period expires (no penalty)
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external onlyOwner {
        if (amount == 0) revert InvalidAmount();
        if (block.timestamp < createdAt + lockPeriod) revert LockPeriodNotExpired();
        
        uint256 balance = getBalance();
        if (amount > balance) revert InsufficientBalance();

        totalDeposits -= amount;

        if (isEthBank) {
            (bool success, ) = payable(owner).call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20 tokenContract = IERC20(token);
            bool success = tokenContract.transfer(owner, amount);
            if (!success) revert TransferFailed();
        }

        emit Withdrawal(owner, amount, 0, block.timestamp);
    }

    /**
     * @dev Emergency withdrawal with 3% penalty (before lock period expires)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        if (amount == 0) revert InvalidAmount();
        
        uint256 balance = getBalance();
        if (amount > balance) revert InsufficientBalance();

        // Calculate penalty (3% of withdrawal amount)
        uint256 penalty = (amount * PENALTY_RATE) / PERCENTAGE_BASE;
        uint256 withdrawAmount = amount - penalty;

        totalDeposits -= amount;

        // Transfer penalty to factory admin
        if (isEthBank) {
            // Transfer penalty to factory
            (bool penaltySuccess, ) = payable(factory).call{value: penalty}("");
            if (!penaltySuccess) revert TransferFailed();
            
            // Transfer remaining amount to owner
            (bool success, ) = payable(owner).call{value: withdrawAmount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20 tokenContract = IERC20(token);
            
            // Transfer penalty to factory
            bool penaltySuccess = tokenContract.transfer(factory, penalty);
            if (!penaltySuccess) revert TransferFailed();
            
            // Transfer remaining amount to owner
            bool success = tokenContract.transfer(owner, withdrawAmount);
            if (!success) revert TransferFailed();
        }

        emit EmergencyWithdrawal(owner, withdrawAmount, penalty, block.timestamp);
    }

    /**
     * @dev Get current balance of the piggy bank
     * @return Current balance
     */
    function getBalance() public view returns (uint256) {
        if (isEthBank) {
            return address(this).balance;
        } else {
            return IERC20(token).balanceOf(address(this));
        }
    }

    /**
     * @dev Check if lock period has expired
     * @return True if lock period has expired
     */
    function isLockExpired() external view returns (bool) {
        return block.timestamp >= createdAt + lockPeriod;
    }

    /**
     * @dev Get remaining lock time
     * @return Remaining lock time in seconds
     */
    function getRemainingLockTime() external view returns (uint256) {
        uint256 unlockTime = createdAt + lockPeriod;
        if (block.timestamp >= unlockTime) {
            return 0;
        }
        return unlockTime - block.timestamp;
    }

    /**
     * @dev Get piggy bank info
     * @return owner_ Owner address
     * @return token_ Token address
     * @return lockPeriod_ Lock period in seconds
     * @return createdAt_ Creation timestamp
     * @return balance Current balance
     * @return isLocked Whether the bank is still locked
     */
    function getPiggyBankInfo() external view returns (
        address owner_,
        address token_,
        uint256 lockPeriod_,
        uint256 createdAt_,
        uint256 balance,
        bool isLocked
    ) {
        return (
            owner,
            token,
            lockPeriod,
            createdAt,
            getBalance(),
            block.timestamp < createdAt + lockPeriod
        );
    }

    /**
     * @dev Receive function to accept ETH deposits
     */
    receive() external payable {
        if (!isEthBank) revert InvalidToken();
        if (msg.sender != owner) revert OnlyOwner();
        
        totalDeposits += msg.value;
        emit Deposit(msg.sender, msg.value, block.timestamp);
    }
}
