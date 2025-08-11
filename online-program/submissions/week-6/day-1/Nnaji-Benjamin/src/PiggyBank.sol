// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";



import "./interfaces/IPiggyBankFactory.sol";

contract PiggyBank is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct SavingsAccount {
        uint256 balance;
        uint256 lockPeriod;
        uint256 startTime;
        address token; // address(0) for ETH
        bool isActive;
    }
    
    address public owner;
    address public factory;
    uint256 public accountCounter;
    
    mapping(uint256 => SavingsAccount) public savingsAccounts;
    
    event SavingsAccountCreated(uint256 indexed accountId, uint256 lockPeriod, address token);
    event Deposited(uint256 indexed accountId, uint256 amount, address token);
    event Withdrawn(uint256 indexed accountId, uint256 amount, uint256 penalty, address token);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    constructor(address _owner, address _factory) {
        owner = _owner;
        factory = _factory;
    }
    
    /**
     * @dev Create a new savings account
     */
    function createSavingsAccount(uint256 _lockPeriod, address _token) external onlyOwner returns (uint256) {
        require(_lockPeriod > 0, "Lock period must be greater than 0");
        
        uint256 accountId = accountCounter++;
        savingsAccounts[accountId] = SavingsAccount({
            balance: 0,
            lockPeriod: _lockPeriod,
            startTime: block.timestamp,
            token: _token,
            isActive: true
        });
        
        emit SavingsAccountCreated(accountId, _lockPeriod, _token);
        return accountId;
    }
    
    /**
     * @dev Deposit ETH to a savings account
     */
    function depositETH(uint256 _accountId) external payable onlyOwner {
        require(savingsAccounts[_accountId].isActive, "Account not active");
        require(savingsAccounts[_accountId].token == address(0), "This account is for tokens only");
        require(msg.value > 0, "Must send some ETH");
        
        savingsAccounts[_accountId].balance += msg.value;
        emit Deposited(_accountId, msg.value, address(0));
    }
    
    /**
     * @dev Deposit ERC20 tokens to a savings account
     */
    function depositToken(uint256 _accountId, uint256 _amount) external onlyOwner {
        require(savingsAccounts[_accountId].isActive, "Account not active");
        require(savingsAccounts[_accountId].token != address(0), "This account is for ETH only");
        require(_amount > 0, "Amount must be greater than 0");
        
        IERC20(savingsAccounts[_accountId].token).safeTransferFrom(owner, address(this), _amount);
        savingsAccounts[_accountId].balance += _amount;
        emit Deposited(_accountId, _amount, savingsAccounts[_accountId].token);
    }
    
    /**
     * @dev Withdraw from a savings account
     */
    function withdraw(uint256 _accountId, uint256 _amount) external onlyOwner nonReentrant {
        SavingsAccount storage account = savingsAccounts[_accountId];
        require(account.isActive, "Account not active");
        require(account.balance >= _amount, "Insufficient balance");
        
        uint256 penalty = 0;
        bool isEarlyWithdrawal = block.timestamp < (account.startTime + account.lockPeriod);
        
        if (isEarlyWithdrawal) {
            penalty = (_amount * 3) / 100; // 3% penalty
        }
        
        uint256 withdrawAmount = _amount - penalty;
        account.balance -= _amount;
        
        if (account.token == address(0)) {
            // ETH withdrawal
            if (penalty > 0) {
                IPiggyBankFactory(factory).collectPenalty{value: penalty}();
            }
            payable(owner).transfer(withdrawAmount);
        } else {
            // Token withdrawal
            if (penalty > 0) {
                IERC20(account.token).safeTransfer(factory, penalty);
                IPiggyBankFactory(factory).collectTokenPenalty(account.token, penalty);
            }
            IERC20(account.token).safeTransfer(owner, withdrawAmount);
        }
        
        emit Withdrawn(_accountId, withdrawAmount, penalty, account.token);
    }
    
    /**
     * @dev Get savings account details
     */
    function getSavingsAccount(uint256 _accountId) external view returns (
        uint256 balance,
        uint256 lockPeriod,
        uint256 startTime,
        address token,
        bool isActive,
        bool isLocked
    ) {
        SavingsAccount memory account = savingsAccounts[_accountId];
        bool locked = block.timestamp < (account.startTime + account.lockPeriod);
        
        return (
            account.balance,
            account.lockPeriod,
            account.startTime,
            account.token,
            account.isActive,
            locked
        );
    }
    
    /**
     * @dev Get total number of savings accounts
     */
    function getTotalAccounts() external view returns (uint256) {
        return accountCounter;
    }
    
    /**
     * @dev Get total balance for a specific token
     */
    function getTotalBalance(address _token) external view returns (uint256) {
        uint256 totalBalance = 0;
        for (uint256 i = 0; i < accountCounter; i++) {
            if (savingsAccounts[i].token == _token && savingsAccounts[i].isActive) {
                totalBalance += savingsAccounts[i].balance;
            }
        }
        return totalBalance;
    }
    
    /**
     * @dev Get all savings accounts for the owner
     */
    function getAllSavingsAccounts() external view returns (
        uint256[] memory accountIds,
        uint256[] memory balances,
        uint256[] memory lockPeriods,
        uint256[] memory startTimes,
        address[] memory tokens,
        bool[] memory isLocked
    ) {
        uint256 count = accountCounter;
        accountIds = new uint256[](count);
        balances = new uint256[](count);
        lockPeriods = new uint256[](count);
        startTimes = new uint256[](count);
        tokens = new address[](count);
        isLocked = new bool[](count);
        
        for (uint256 i = 0; i < count; i++) {
            SavingsAccount memory account = savingsAccounts[i];
            accountIds[i] = i;
            balances[i] = account.balance;
            lockPeriods[i] = account.lockPeriod;
            startTimes[i] = account.startTime;
            tokens[i] = account.token;
            isLocked[i] = block.timestamp < (account.startTime + account.lockPeriod);
        }
        
        return (accountIds, balances, lockPeriods, startTimes, tokens, isLocked);
    }
}