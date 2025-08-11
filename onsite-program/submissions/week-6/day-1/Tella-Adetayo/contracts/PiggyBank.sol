// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interface/IPiggyBank.sol";
import "../interface/IFactory.sol";
import "../library/Storage.sol";
import "../library/error.sol";

contract PiggyBank is IPiggyBank {
    using SafeERC20 for IERC20;
    using Storage for Storage.Layout;

    uint256 private constant FEE_NUM = 3;
    uint256 private constant FEE_DEN = 100;

    constructor(address _owner) {
        Storage.Layout storage ds = Storage.layout();

        ds.owner = _owner;
        ds.factory = msg.sender;
        ds.createdAt = block.timestamp;

        if (ds.lockPeriodSeconds > 0) {
            ds.lockedUntil = block.timestamp + ds.lockPeriodSeconds;
        }
        ds.active = true;
    }

    function deposit(uint256 amount) external override nonReentrant {
        if (amount == 0) revert Error.INVALID_AMOUNT();

        Storage.Layout storage ds = Storage.layout();

        if (ds.token == address(0)) revert Error.INVALID_TOKEN();

        IERC20 token = IERC20(ds.token);

        uint256 before = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 afterDeposit = token.balanceOf(address(this));

        if (afterDeposit < before) revert Error.INVALID_TOKEN_BALANCE(); 

        uint256 received = afterDeposit - before;
        if (received == 0) revert Error.INVALID_AMOUNT();

        ds.balance += received;

        // Factory update 
        if (ds.factory != address(0)) {
            IFactory(ds.factory).updateAggregateOnDeposit(ds.owner, received);
        }

        emit Events.Deposited(msg.sender, received);
    }

    function depositETH() external payable override nonReentrant {
        if (msg.value == 0) revert Error.INVALID_AMOUNT();

        Storage.Layout storage ds = Storage.layout();

        if (ds.token != address(0)) revert Error.INVALID_TOKEN();

        ds.balance += msg.value;

        if (ds.factory != address(0)) {
            IFactory(ds.factory).updateAggregateOnDeposit(ds.owner, msg.value);
        }

        emit Events.DepositedETH(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external override nonReentrant {
        if (amount == 0) revert Error.INVALID_AMOUNT();

        Storage.Layout storage ds = Storage.layout();

        if (ds.owner != msg.sender) {
            revert Error.UNAUTHORIZED_TO_PERFORM_TRANSACTION();
        }

        if (ds.lockedUntil != 0) {
            require(block.timestamp >= ds.lockedUntil, "Still locked");
        }

        if (amount > ds.balance) revert Error.INSUFFICIENT_BALANCE();

        ds.balance -= amount;

        if (ds.factory != address(0)) {
            IFactory(ds.factory).updateAggregateOnWithdraw(ds.owner, amount);
        }

        if (ds.token == address(0)) {
            
            (bool ok, ) = msg.sender.call{value: amount}("");
            require(ok, "ETH transfer failed");
        } else {
            IERC20(ds.token).safeTransfer(msg.sender, amount);
        }

        emit Events.Withdrawn(msg.sender, amount);
    }

    function earlyWithdraw(uint256 amount) external override nonReentrant {
        if (amount == 0) revert Error.INVALID_AMOUNT();

        Storage.Layout storage ds = Storage.layout();

        if (ds.owner != msg.sender) {
            revert Error.UNAUTHORIZED_TO_PERFORM_TRANSACTION();
        }

        if (ds.lockedUntil == 0) revert Error.NO_LOCK_SET(); 
        if (block.timestamp > ds.lockedUntil) revert Error.USE_WITHDRAW(); 
        if(amount > ds.balance) revert Error.INSUFFICIENT_BALANCE(); 

        uint256 fee = (amount * FEE_NUM) / FEE_DEN; 
        uint256 net = amount - fee;

        ds.balance -= amount;

        if (ds.factory != address(0)) {
            IFactory(ds.factory).updateAggregateOnWithdraw(ds.owner, amount);
        }

        address admin = address(0);
        if (ds.factory != address(0)) {
            
            admin = IFactory(ds.factory).admin();
        }

        if (ds.token == address(0)) {
            
            if (fee > 0 && admin != address(0)) {
                (bool okFee, ) = admin.call{value: fee}("");
                require(okFee, "Fee transfer failed");
            }
            (bool okNet, ) = msg.sender.call{value: net}("");
            require(okNet, "ETH transfer failed");
        } else {
            IERC20 token = IERC20(ds.token);
            if (fee > 0 && admin != address(0)) {
                token.safeTransfer(admin, fee);
            }
            token.safeTransfer(msg.sender, net);
        }

        emit EarlyWithdrawn(msg.sender, amount, fee);
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

    function extendLock(uint256 additionalSeconds) external override {
        if (additionalSeconds == 0) revert Error.INVALID_AMOUNT();

        Storage.Layout storage ds = Storage.layout();
        if (ds.owner != msg.sender) {
            revert Error.UNAUTHORIZED_TO_PERFORM_TRANSACTION();
        }

   
        if (ds.lockedUntil == 0) revert Error.NOT_INITIALIZED();

        ds.lockedUntil = ds.lockedUntil + additionalSeconds;

        emit LockExtended(additionalSeconds, ds.lockedUntil);
    }

    receive() external payable {
        Storage.Layout storage ds = Storage.layout();
        if (ds.token != address(0)) {
            
            revert Error.INVALID_TOKEN();
        }
        ds.balance += msg.value;
        if (ds.factory != address(0)) {
            IFactory(ds.factory).updateAggregateOnDeposit(ds.owner, msg.value);
        }
        emit DepositedETH(msg.sender, msg.value);
    }
}
