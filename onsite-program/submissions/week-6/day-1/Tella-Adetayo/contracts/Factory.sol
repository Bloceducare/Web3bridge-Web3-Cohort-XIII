// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PiggyBank.sol"; 
import "../interface/IFactory.sol";
import "../library/error.sol"; 
import "../library/Storage.sol";

contract Factory is IFactory {
    address public admin; 
    uint256 private _collectedFeesETH; 

    mapping(address => address[]) private _accounts; 
    mapping(address => uint256) private _aggregateBalances; 
    mapping(address => uint256) private _collectedFeesToken; 
    mapping(address => address) private _childToOwner; 
    
    event SavingsCreated(address indexed owner, address indexed child, address token, uint256 lockPeriodSeconds);

    constructor() {
        admin = msg.sender; 
    }

    function createPiggyBank(address _token, uint256  _lockPeriodsSeconds) external override returns (address _child) {
        if (_lockPeriodsSeconds == 0) revert Error.PERIOD_MUST_BE_GREATER_THAN_ZERO(); 

        // PiggyBank piggyBank = new PiggyBank(msg.sender, _token, _lockPeriodsSeconds); 

        {
            if (_lockPeriodsSeconds == 0) revert Error.PERIOD_MUST_BE_GREATER_THAN_ZERO();

            PiggyBank piggyBank = new PiggyBank(msg.sender, _token, _lockPeriodsSeconds); 

            // Cache Solidity variables for assembly
            address tokenAddr = _token;
            uint256 lockPeriod = _lockPeriodsSeconds;
            uint256 createdAt = block.timestamp;
            uint256 lockedUntil = block.timestamp + _lockPeriodsSeconds;
            address factoryAddr = address(this);

            bytes32 slot = Storage.STORAGE_SLOT;

            assembly {
                let ds := slot
                sstore(add(ds, 2), tokenAddr)        // token
                sstore(add(ds, 3), lockPeriod)       // lockPeriodSeconds
                sstore(add(ds, 4), createdAt)        // createdAt
                sstore(add(ds, 5), lockedUntil)      // lockedUntil
                sstore(add(ds, 1), factoryAddr)      // factory
                sstore(add(ds, 7), 1)                // active = true
            }
             _child = address(piggyBank);
            _accounts[msg.sender].push(_child);
            _childToOwner[_child] = msg.sender;

            emit SavingsCreated(msg.sender, _child, _token, _lockPeriodsSeconds);
        }
    }

    function getAccounts(address _user) external view override returns (address[] memory) {
        return _accounts[_user]; 
    }

    function getAccountCount(address _user) external view override returns (uint256) {
        return _accounts[_user].length; 
    }

    function updateAggregateOnDeposit(address _user, uint256 _amount) external override {
        if (_childToOwner[msg.sender] != _user) revert Error.UNAUTHORIZED_CALLER();

        if (_aggregateBalances[_user] >= _amount) {
            _aggregateBalances[_user] -= _amount;
        }
    }

    function updateAggregateOnWithDraw(address _user, uint256 _amount) external override {
        if (_childToOwner[msg.sender] != _user) revert Error.UNAUTHORIZED_CALLER();
        if (_aggregateBalances[_user] <= _amount) revert Error.AGGREGATE_OVERFLOW();
        _aggregateBalances[_user] -= _amount;
    }

    function getAggregateBalance(address _user) external view returns (uint256) {
        return _aggregateBalances[_user]; 
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