// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PiggyBank.sol"; 
import "../interface/IFactory.sol";
import "../library/error.sol"; 

contract Factory is IFactory {
    address public override admin;

    mapping(address => address[]) private _accounts;

    mapping(address => uint256) private _aggregateBalances;

    uint256 private _collectedFeesETH;
    mapping(address => uint256) private _collectedFeesToken;
    mapping(address => address) private _childToOwner;

    event SavingsCreated(address indexed owner, address indexed child, address token, uint256 lockPeriodSeconds);

    constructor() {
        admin = msg.sender;
    }

 
    function createSavings(address token, uint256 lockPeriodSeconds) external override returns (address child) {
        if (lockPeriodSeconds == 0) revert Error.PERIOD_MUST_BE_GREATER_THAN_ZERO(); 
        require(lockPeriodSeconds > 0, "Lock period must be > 0");

        PiggyBank piggy = new PiggyBank(msg.sender);

        {
            // Access Storage layout of child to set token and lock params
            bytes32 slot = Storage.STORAGE_SLOT;
            assembly {
                let ds := slot
                sstore(add(ds, 2), token)             // token
                sstore(add(ds, 3), lockPeriodSeconds) // lockPeriodSeconds
                sstore(add(ds, 4), timestamp())       // createdAt
                sstore(add(ds, 5), add(timestamp(), lockPeriodSeconds)) // lockedUntil
                sstore(add(ds, 1), address(this))     // factory
                sstore(add(ds, 7), 1)                 // active = true
            }
        }

        child = address(piggy);

        _accounts[msg.sender].push(child);
        _childToOwner[child] = msg.sender;

        emit SavingsCreated(msg.sender, child, token, lockPeriodSeconds);
    }

    function getAccounts(address user) external view override returns (address[] memory) {
        return _accounts[user];
    }

    function getAccountCount(address user) external view override returns (uint256) {
        return _accounts[user].length;
    }

    function updateAggregateOnDeposit(address user, uint256 amount) external override {
        require(_childToOwner[msg.sender] == user, "Unauthorized caller");
        _aggregateBalances[user] += amount;
    }

    function updateAggreageOnWithDraw(address user, uint256 amount) external override {
        require(_childToOwner[msg.sender] == user, "Unauthorized caller");
        require(_aggregateBalances[user] >= amount, "Aggregate underflow");
        _aggregateBalances[user] -= amount;
    }

    function getAggregateBalance(address user) external view returns (uint256) {
        return _aggregateBalances[user];
    }

    receive() external payable {
        _collectedFeesETH += msg.value;
    }

    function collectFeeToken(address token, uint256 amount) external {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        _collectedFeesToken[token] += amount;
    }

    function adminWithdrawFees(address token) external override {
        require(msg.sender == admin, "Only admin");

        if (token == address(0)) {
            uint256 amount = _collectedFeesETH;
            require(amount > 0, "No ETH fees");
            _collectedFeesETH = 0;
            payable(admin).transfer(amount);
        } else {
            uint256 amount = _collectedFeesToken[token];
            require(amount > 0, "No token fees");
            _collectedFeesToken[token] = 0;
            IERC20(token).transfer(admin, amount);
        }
    }

    function _isRegisteredChild(address child, address user) internal view returns (bool) {
        return _childToOwner[child] == user;
    }
}
