// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./Token.sol"; 
import "../interface/IPiggyBank.sol";
import "../interface/IFactory.sol"; 
import "../library/Storage.sol"; 
import "../library/error.sol";  
import "../events/Events.sol"; 


contract PiggyBank is IPiggyBank {
    using Storage for Storage.Layout; 
    using SafeERC20 for IERC20; 

    uint256 private constant FEE_NUM = 3;
    uint256 private constant FEE_DEN = 100;

    constructor(address _owner, address _token, uint256 _lockPeriodSeconds) {
        Storage.Layout storage ds = Storage.layout();

        ds.owner = _owner; 
        ds.token = _token;
        ds.lockPeriodSeconds = _lockPeriodSeconds; 
        ds.factory = msg.sender; 
        ds.createdAt = block.timestamp; 

        if (ds.lockPeriodSeconds > 0) {
            ds.lockedUntil = block.timestamp + _lockPeriodSeconds; 
        } else {
            ds.lockedUntil = 0; 
        }
        ds.active = true; 

    }

    function deposit(uint256 _amount) external override {
        if (_amount == 0) revert Error.INVALID_AMOUNT();

        Storage.Layout storage ds = Storage.layout();

        if (ds.token == address(0)) revert Error.INVALID_TOKEN();

        IERC20 piggyToken = IERC20(ds.token); 

        uint256 beforeDeposit = piggyToken.balanceOf(address(this));
        piggyToken.safeTransferFrom(msg.sender, address(this), _amount);
        uint256 afterDeposit = piggyToken.balanceOf(address(this));

        if (afterDeposit <= beforeDeposit) revert Error.INVALID_AMOUNT();

        uint256 received = afterDeposit - beforeDeposit;

        ds.balance += received; 

        if (ds.factory != address(0)) {
            IFactory(ds.factory).updateAggregateOnDeposit(ds.owner, received);    
        }

        emit Events.Deposited(msg.sender, received); 
        
    }

    function depositETH() external payable override {
        if (msg.value == 0) revert Error.INVALID_AMOUNT();

        Storage.Layout storage ds = Storage.layout();

        if (ds.token == address(0)) revert Error.INVALID_TOKEN();

        ds.balance += msg.value; 

        if (ds.factory != address(0)) {
            IFactory(ds.factory).updateAggregateOnDeposit(ds.owner, msg.value);

        }

        emit Events.DepositedETH(msg.sender, msg.value);
    }
    
    function withdraw(uint256 _amount) external override {
        if (_amount == 0) revert Error.INVALID_AMOUNT();

        Storage.Layout storage ds = Storage.layout();

        if (ds.owner != msg.sender) revert Error.UNAUTHORIZED_TO_PERFORM_TRANSACTION(); 

        if (ds.lockedUntil != 0) {
            require(block.timestamp >= ds.lockedUntil, "Still locked");
        }
        
        if (_amount > ds.balance) revert Error.INSUFFICIENT_AMOUNT();
        
        if (ds.token != address(0)) {
            (bool ok, ) = msg.sender.call{value: _amount}(""); 
            require(ok, "ETH transfer failed"); 
        } else {
            IERC20(ds.token).safeTransfer(msg.sender, _amount);
        }

        emit Events.Withdrawn(msg.sender, _amount); 

    }

    function earlyWithdraw(uint256 _amount) external override {
        if (_amount == 0) revert Error.INVALID_AMOUNT();

        Storage.Layout storage ds = Storage.layout();
        
        if (ds.owner != msg.sender) revert Error.UNAUTHORIZED_TO_PERFORM_TRANSACTION();

        if (ds.lockedUntil == 0) revert Error.NO_LOCK_SET();

        if (block.timestamp >= ds.lockedUntil) revert Error.USE_WITHDRAW(); 

        uint256 fee = (_amount * FEE_NUM) / FEE_DEN; 
        uint256 net = _amount - fee; 

        ds.balance -= _amount; 

        if (ds.factory != address(0)) {
            IFactory(ds.factory).updateAggregateOnWithDraw(ds.owner, _amount);
        }

        address adminAddr = address(0); 
        if (ds.factory != address(0)) {
            try IFactory(ds.factory).admin() returns (address a) {
                adminAddr = a;
            } catch {
                adminAddr = address(0);
            }
        }

        if (ds.token == address(0)) {
            if (fee > 0 && adminAddr != address(0)) {
                (bool okFee, ) = adminAddr.call{value: fee}(""); 
                require(okFee, "Fee transfer failed");
            }
            (bool okNet, ) = msg.sender.call{value: net}(""); 
            require(okNet, "ETH transfer failed"); 
        } else {
            IERC20 piggyToken =  IERC20(ds.token); 
            if (fee > 0 && adminAddr != address(0)) {
                piggyToken.safeTransfer(adminAddr, fee);
            }

            piggyToken.safeTransfer(msg.sender, net); 
        }

        emit Events.EarlyWithdrawn(msg.sender, _amount, fee); 
    }

    function getBalance() external view override returns (uint256) {
        Storage.Layout storage ds = Storage.layout();
        return ds.balance; 
    }


    function owner() external view override returns (address) {
        Storage.Layout storage ds = Storage.layout();
        return ds.owner;
    }

    function token() external view override returns (address) {
        Storage.Layout storage ds = Storage.layout();
        return ds.token; 
    }

    function lockedUtils() external view override returns (uint256) {
        Storage.Layout storage ds = Storage.layout();
        return ds.lockedUntil; 
    } 
    
    function extendLock(uint256 _additionalSeconds) external override {
        if (_additionalSeconds == 0) revert Error.INVALID_TIME();

        Storage.Layout storage ds = Storage.layout();

        if (ds.lockedUntil == 0) revert Error.NOT_INITIALIZED();

        ds.lockedUntil = ds.lockedUntil + _additionalSeconds; 

        emit Events.LockExtended(_additionalSeconds, ds.lockedUntil);
    }

    receive() external payable {
        Storage.Layout storage ds = Storage.layout();

        if (ds.token != address(0)) revert Error.INVALID_TOKEN();

        if (msg.value == 0) revert Error.INVALID_AMOUNT();

        ds.balance += msg.value; 

        if (ds.factory != address(0)) {
            IFactory(ds.factory).updateAggregateOnDeposit(ds.owner, msg.value);
        }

        emit Events.DepositedETH(msg.sender, msg.value); 

    }

}