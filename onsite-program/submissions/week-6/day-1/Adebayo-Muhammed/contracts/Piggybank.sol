// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; 

contract PiggyBank is ReentrancyGuard {
    struct SavingsAccount {
        uint256 balance;          
        uint256 depositTime;      
        uint256 lockPeriod;  
        address tokenAddress;     
        bool isActive;           
    }
    
    address public owner;                   
    address public factoryAdmin;            
    uint256 public constant BREAKING_FEE = 3;
    
    SavingsAccount[] public savingsAccounts;
    
    event SavingsAccountCreated(uint256 indexed accountId, address token, uint256 lockPeriod);
    event Deposited(uint256 indexed accountId, uint256 amount);
    event Withdrawn(uint256 indexed accountId, uint256 amount, bool earlyWithdrawal, uint256 fee);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    modifier validAccount(uint256 accountId) {
        require(accountId < savingsAccounts.length, "Invalid account ID");
        require(savingsAccounts[accountId].isActive, "Account not active");
        _;
    }
    
    constructor(address _owner, address _factoryAdmin) {
        owner = _owner;
        factoryAdmin = _factoryAdmin;
    }
    

    function createSavingsAccount(uint256 lockPeriod, address tokenAddress) external onlyOwner returns (uint256) {
        require(lockPeriod > 0, "Lock period must be greater than 0");
        
        SavingsAccount memory newAccount = SavingsAccount({
            balance: 0,
            depositTime: 0,
            lockPeriod: lockPeriod,
            tokenAddress: tokenAddress,
            isActive: true
        });
        
        savingsAccounts.push(newAccount);
        uint256 accountId = savingsAccounts.length - 1;
        
        emit SavingsAccountCreated(accountId, tokenAddress, lockPeriod);
        return accountId;
    }
    
    function depositETH(uint256 accountId) external payable onlyOwner validAccount(accountId) nonReentrant {
        require(msg.value > 0, "Must send ETH");
        require(savingsAccounts[accountId].tokenAddress == address(0), "This account is for tokens, not ETH");
        
        savingsAccounts[accountId].balance += msg.value;
        savingsAccounts[accountId].depositTime = block.timestamp;
        
        emit Deposited(accountId, msg.value);
    }
    
     function depositToken(uint256 accountId, uint256 amount) external onlyOwner validAccount(accountId) nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(savingsAccounts[accountId].tokenAddress != address(0), "This account is for ETH, not tokens");
        
        IERC20 token = IERC20(savingsAccounts[accountId].tokenAddress);
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        
        savingsAccounts[accountId].balance += amount;
        savingsAccounts[accountId].depositTime = block.timestamp;
        
        emit Deposited(accountId, amount);
    }

    function withdraw(uint256 accountId) external onlyOwner validAccount(accountId) nonReentrant {
        SavingsAccount storage account = savingsAccounts[accountId];
        require(block.timestamp >= account.depositTime + account.lockPeriod, "Lock period not over");
        
        uint256 amount = account.balance;
        account.balance = 0;
        account.isActive = false; // Mark the account as inactive
        
        if (account.tokenAddress == address(0)) {
            payable(owner).transfer(amount);
        } else {
            IERC20 token = IERC20(account.tokenAddress);
            require(token.transfer(owner, amount), "Token transfer failed");
        }
        
        emit Withdrawn(accountId, amount, false, 0);
    }

    function withdraw(uint256 accountId, uint256 amount) external onlyOwner validAccount(accountId) nonReentrant {
        SavingsAccount storage account = savingsAccounts[accountId];
        require(amount > 0, "Amount must be greater than 0");
        require(account.balance >= amount, "Insufficient balance");
        
        bool isEarlyWithdrawal = block.timestamp < (account.depositTime + account.lockPeriod);
        uint256 fee = 0;
        uint256 withdrawAmount = amount;
        
        if (isEarlyWithdrawal) {
            fee = (amount * BREAKING_FEE) / 100;
            withdrawAmount = amount - fee;
        }
        
        account.balance -= amount;
        
        if (account.tokenAddress == address(0)) {
            // ETH withdrawal
            if (fee > 0) {
                (bool feeSuccess, ) = payable(factoryAdmin).call{value: fee}("");
                require(feeSuccess, "Fee transfer failed");
            }
            (bool success, ) = payable(owner).call{value: withdrawAmount}("");
            require(success, "ETH transfer failed");
        } else {
            // Token withdrawal
            IERC20 token = IERC20(account.tokenAddress);
            if (fee > 0) {
                require(token.transfer(factoryAdmin, fee), "Fee transfer failed");
            }
            require(token.transfer(owner, withdrawAmount), "Token transfer failed");
        }
        
        emit Withdrawn(accountId, amount, isEarlyWithdrawal, fee);
    }
    
    function getAccountBalance(uint256 accountId) external view validAccount(accountId) returns (uint256) {
        return savingsAccounts[accountId].balance;
    }

    function getAccountDetails(uint256 accountId) external view validAccount(accountId) returns (SavingsAccount memory) {
        return savingsAccounts[accountId];
    }
    
    function getTotalAccounts() external view returns (uint256) {
        return savingsAccounts.length;
    }

    function checkLockStatus(uint256 accountId) external view validAccount(accountId) returns (bool isEarly, uint256 timeLeft) {
        SavingsAccount memory account = savingsAccounts[accountId];
        uint256 unlockTime = account.depositTime + account.lockPeriod;
        
        if (block.timestamp >= unlockTime) {
            return (false, 0);
        } else {
            return (true, unlockTime - block.timestamp);
        }
    }

}
