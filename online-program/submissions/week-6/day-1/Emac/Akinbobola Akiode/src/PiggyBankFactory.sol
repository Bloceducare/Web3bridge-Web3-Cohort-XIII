// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./PiggyBank.sol";
import "./interfaces/IPiggyBank.sol";
import "./errors/CustomErrors.sol";

contract PiggyBankFactory {
    address public immutable admin;
    
    mapping(address => address[]) private _userAccounts;
    mapping(address => uint256) private _accountBalances;
    mapping(address => uint64) private _accountLockPeriods;
    mapping(address => uint64) private _accountStartTimes;
    
    event AccountCreated(address indexed _owner, address indexed _account, address _tokenAddress, uint64 _lockPeriod);
    event FactoryBalanceUpdated(address indexed _user, uint256 _newBalance);
    
    modifier onlyAdmin() {
        if (msg.sender != admin) revert PiggyBankFactory__NotAdmin();
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    function createPiggyBank(
        address _tokenAddress,
        uint64 _lockPeriod
    ) external returns (address) {
        if (_lockPeriod == 0) revert PiggyBankFactory__InvalidLockPeriod();
        
        PiggyBank piggyBank = new PiggyBank(
            msg.sender,
            _tokenAddress,
            admin,
            _lockPeriod
        );
        
        address accountAddress = address(piggyBank);
        _userAccounts[msg.sender].push(accountAddress);
        _accountLockPeriods[accountAddress] = _lockPeriod;
        _accountStartTimes[accountAddress] = uint64(block.timestamp);
        
        emit AccountCreated(msg.sender, accountAddress, _tokenAddress, _lockPeriod);
        return accountAddress;
    }
    
    function getUserAccounts(address _user) external view returns (address[] memory) {
        return _userAccounts[_user];
    }
    
    function getUserAccountCount(address _user) external view returns (uint256) {
        return _userAccounts[_user].length;
    }
    
    function getAccountBalance(address _account) external view returns (uint256) {
        return IPiggyBank(_account).getBalance();
    }
    
    function getAccountLockPeriod(address _account) external view returns (uint64) {
        return _accountLockPeriods[_account];
    }
    
    function getAccountStartTime(address _account) external view returns (uint64) {
        return _accountStartTimes[_account];
    }
    
    function getAccountLockExpiry(address _account) external view returns (uint64) {
        return _accountStartTimes[_account] + _accountLockPeriods[_account];
    }
    
    function isAccountLockExpired(address _account) external view returns (bool) {
        return IPiggyBank(_account).isLockExpired();
    }
    
    function getTotalUserBalance(address _user) external view returns (uint256) {
        address[] memory accounts = _userAccounts[_user];
        uint256 totalBalance = 0;
        
        for (uint256 i = 0; i < accounts.length; i++) {
            totalBalance += IPiggyBank(accounts[i]).getBalance();
        }
        
        return totalBalance;
    }
    
    function updateAccountBalance(address _account) external {
        uint256 newBalance = IPiggyBank(_account).getBalance();
        _accountBalances[_account] = newBalance;
        emit FactoryBalanceUpdated(IPiggyBank(_account).getOwner(), newBalance);
    }
    
    function getAccountInfo(address _account) external view returns (
        address owner,
        address tokenAddress,
        uint256 balance,
        uint64 lockPeriod,
        uint64 startTime,
        uint64 lockExpiry,
        bool isLockExpired
    ) {
        IPiggyBank piggyBank = IPiggyBank(_account);
        owner = piggyBank.getOwner();
        tokenAddress = piggyBank.getTokenAddress();
        balance = piggyBank.getBalance();
        lockPeriod = _accountLockPeriods[_account];
        startTime = _accountStartTimes[_account];
        lockExpiry = startTime + lockPeriod;
        isLockExpired = piggyBank.isLockExpired();
    }
} 