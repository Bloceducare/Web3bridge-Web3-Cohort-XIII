// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IERC20.sol";
import "./interfaces/IPiggyBank.sol";
import "./errors/CustomErrors.sol";

contract PiggyBank is IPiggyBank {
    address public immutable owner;
    address public immutable tokenAddress;
    address public immutable admin;
    uint64 public immutable lockPeriod;
    uint64 public immutable startTime;
    
    uint256 private _balance;
    bool private _isERC20;
    
    event Deposited(address indexed _owner, uint256 _amount, bool _isERC20);
    event Withdrawn(address indexed _owner, uint256 _amount, bool _isERC20);
    event BreakingFeePaid(address indexed _owner, uint256 _amount);
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert PiggyBank__NotOwner();
        _;
    }
    
    constructor(
        address _owner,
        address _tokenAddress,
        address _admin,
        uint64 _lockPeriod
    ) {
        if (_owner == address(0)) revert PiggyBank__ZeroAddress();
        if (_admin == address(0)) revert PiggyBank__ZeroAddress();
        if (_lockPeriod == 0) revert PiggyBank__InvalidLockPeriod();
        
        owner = _owner;
        tokenAddress = _tokenAddress;
        admin = _admin;
        lockPeriod = _lockPeriod;
        startTime = uint64(block.timestamp);
        _isERC20 = _tokenAddress != address(0);
    }
    
    function deposit() external payable override onlyOwner {
        if (msg.value == 0) revert PiggyBank__ZeroAmount();
        if (_isERC20) revert PiggyBank__InvalidTokenAddress();
        
        _balance += msg.value;
        emit Deposited(owner, msg.value, false);
    }
    
    function depositERC20(uint256 _amount) external override onlyOwner {
        if (_amount == 0) revert PiggyBank__ZeroAmount();
        if (!_isERC20) revert PiggyBank__InvalidTokenAddress();
        
        IERC20 token = IERC20(tokenAddress);
        if (!token.transferFrom(msg.sender, address(this), _amount)) {
            revert PiggyBank__TransferFailed();
        }
        
        _balance += _amount;
        emit Deposited(owner, _amount, true);
    }
    
    function withdraw() external override onlyOwner {
        if (_balance == 0) revert PiggyBank__InsufficientBalance();
        
        uint256 amount = _balance;
        _balance = 0;
        
        if (!_isLockExpired()) {
            uint256 fee = (amount * 3) / 100;
            uint256 userAmount = amount - fee;
            
            if (_isERC20) {
                IERC20 token = IERC20(tokenAddress);
                if (!token.transfer(owner, userAmount)) revert PiggyBank__TransferFailed();
                if (!token.transfer(admin, fee)) revert PiggyBank__TransferFailed();
            } else {
                (bool success1, ) = owner.call{value: userAmount}("");
                if (!success1) revert PiggyBank__TransferFailed();
                (bool success2, ) = admin.call{value: fee}("");
                if (!success2) revert PiggyBank__TransferFailed();
            }
            
            emit BreakingFeePaid(owner, fee);
            emit Withdrawn(owner, userAmount, _isERC20);
        } else {
            if (_isERC20) {
                IERC20 token = IERC20(tokenAddress);
                if (!token.transfer(owner, amount)) revert PiggyBank__TransferFailed();
            } else {
                (bool success, ) = owner.call{value: amount}("");
                if (!success) revert PiggyBank__TransferFailed();
            }
            
            emit Withdrawn(owner, amount, _isERC20);
        }
    }
    
    function withdrawERC20() external override onlyOwner {
        if (!_isERC20) revert PiggyBank__InvalidTokenAddress();
        this.withdraw();
    }
    
    function getBalance() external view override returns (uint256) {
        return _balance;
    }
    
    function getLockExpiry() external view override returns (uint64) {
        return startTime + lockPeriod;
    }
    
    function getOwner() external view override returns (address) {
        return owner;
    }
    
    function getTokenAddress() external view override returns (address) {
        return tokenAddress;
    }
    
    function isLockExpired() external view override returns (bool) {
        return _isLockExpired();
    }
    
    function _isLockExpired() private view returns (bool) {
        return block.timestamp >= startTime + lockPeriod;
    }
    
    receive() external payable {
        if (!_isERC20 && msg.sender == owner) {
            _balance += msg.value;
            emit Deposited(owner, msg.value, false);
        }
    }
} 