// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../libraries/Data.sol";

contract PiggyBank {
    
    using PiggyBankData for PiggyBankData.SavingsAccount;

    
    mapping(address => PiggyBankData.SavingsAccount[]) public userSavings;
    
    mapping(address => uint256) public userAccountCount;
    
    address public admin;

    
    constructor() {
        admin = msg.sender;
    }


    function create_multiple_savings_account(
        address[] calldata _tokens,
        uint256[] calldata _lockPeriods,
        string[] calldata _userNames
    ) external {
        if (_tokens.length != _lockPeriods.length || _tokens.length != _userNames.length) {
            revert PiggyBankData.ArrayLengthMismatch();
        }
        if (_tokens.length == 0) {
            revert PiggyBankData.NoAccountsProvided();
        }
        

        for (uint256 i = 0; i < _lockPeriods.length; i++) {
            if (_lockPeriods[i] == 0) {
                revert PiggyBankData.InvalidLockPeriod();
            }
            // Check against existing accounts
            for (uint256 j = 0; j < userSavings[msg.sender].length; j++) {
                if (userSavings[msg.sender][j].lockPeriod == _lockPeriods[i]) {
                    revert PiggyBankData.DuplicateLockPeriod();
                }
            }
            // Check within the new batch
            for (uint256 j = i + 1; j < _lockPeriods.length; j++) {
                if (_lockPeriods[i] == _lockPeriods[j]) {
                    revert PiggyBankData.DuplicateLockPeriod();
                }
            }
        }

        for (uint256 i = 0; i < _tokens.length; i++) {
            uint256 lockEnd = block.timestamp + _lockPeriods[i];
            userSavings[msg.sender].push(PiggyBankData.SavingsAccount({
                token: _tokens[i],
                lockPeriod: _lockPeriods[i],
                lockEnd: lockEnd,
                balance: 0,
                userName: _userNames[i]
            }));
            userAccountCount[msg.sender]++;
        }

        emit PiggyBankData.AccountsCreated(msg.sender, _tokens, _lockPeriods, _userNames);
    }

    
    function save_erc20_or_ethers(uint256 _accountId, uint256 _amount) external payable {
    
        if (_accountId >= userSavings[msg.sender].length) {
            revert PiggyBankData.InvalidAccountId();
        }

        
        PiggyBankData.SavingsAccount storage account = userSavings[msg.sender][_accountId];

        
        bool isETH = account.token == address(0);

        if (isETH) {
            // For ETH deposits, ensure msg.value is positive and matches _amount
            if (msg.value == 0) {
                revert PiggyBankData.ZeroDeposit();
            }
            if (_amount != msg.value) {
                revert PiggyBankData.AmountMismatch();
            }
            // Update the balance
            account.balance += msg.value;
        } else {
            // For ERC20 deposits, ensure amount is positive
            if (_amount == 0) {
                revert PiggyBankData.ZeroDeposit();
            }
            // Transfer ERC20 tokens from the user to this contract
            if (!IERC20(account.token).transferFrom(msg.sender, address(this), _amount)) {
                revert PiggyBankData.ERC20TransferFailed();
            }
            
            account.balance += _amount;
        }

        
        emit PiggyBankData.Deposited(msg.sender, _accountId, _amount, account.token);
    }

    
    function user_balance() external view returns (uint256[] memory accountIds, uint256[] memory balances) {
        
        uint256 accountCount = userSavings[msg.sender].length;

        
        accountIds = new uint256[](accountCount);

        balances = new uint256[](accountCount);

        // Populate arrays with account IDs and balances
        for (uint256 i = 0; i < accountCount; i++) {
            accountIds[i] = i;
            balances[i] = userSavings[msg.sender][i].balance;
        }

        return (accountIds, balances);
    }

    
    function track_user_savingAccount_number() external view returns (uint256) {
        
        return userAccountCount[msg.sender];
    }

    
    function withdraw_funds(uint256 _accountId, uint256 _amount) external {
        if (_accountId >= userSavings[msg.sender].length) {
            revert PiggyBankData.InvalidAccountId();
        }
        if (_amount == 0) {
            revert PiggyBankData.ZeroAmount();
        }
        PiggyBankData.SavingsAccount storage account = userSavings[msg.sender][_accountId];
        if (_amount > account.balance) {
            revert PiggyBankData.InsufficientBalance();
        }
        bool isETH = account.token == address(0);

        bool earlyWithdrawal = block.timestamp < account.lockEnd;

        uint256 fee = earlyWithdrawal ? (_amount * 3) / 100 : 0;

        uint256 toUser = _amount - fee;

        account.balance -= _amount;

        if (isETH) {
            if (address(this).balance < _amount) {
                revert PiggyBankData.InsufficientBalance();
            }
            if (fee > 0) {
                payable(admin).transfer(fee);
            }
            payable(msg.sender).transfer(toUser);
        } else {
            if (IERC20(account.token).balanceOf(address(this)) < _amount) {
                revert PiggyBankData.InsufficientBalance();
            }
            if (fee > 0) {
                if (!IERC20(account.token).transfer(admin, fee)) {
                    revert PiggyBankData.TransferFailed();
                }
            }
            if (!IERC20(account.token).transfer(msg.sender, toUser)) {
                revert PiggyBankData.TransferFailed();
            }
        }
        emit PiggyBankData.Withdrawn(msg.sender, _accountId, toUser, fee, account.token);
    }
}