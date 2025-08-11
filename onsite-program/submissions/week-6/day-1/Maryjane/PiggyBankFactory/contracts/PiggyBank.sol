// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IPiggyBank.sol";
import "./IPiggyBankFactory.sol";

contract PiggyBank is IPiggyBank {
    address public owner;
    address public factory;
    uint256 public savingsAccountCount;

    struct SavingsPlan {
        bool isEther;
        address token;
        uint256 balance;
        uint256 lockPeriod;
        uint256 startTime;
    }

    mapping(uint256 => SavingsPlan) public savingsPlans;
    uint256[] public savingsPlanIds;

    constructor(address _owner, address _factory) {
        owner = _owner;
        factory = _factory;
        savingsAccountCount = 0;
    }

    function createSavingsPlan(bool _isEther, address _token, uint256 _lockPeriod) external payable {
        require(msg.sender == owner, "Only owner can create savings plan");
        require(_lockPeriod > 0, "Lock period must be greater than 0");
        if (!_isEther) {
            require(_token != address(0), "Invalid token address");
        }

        uint256 planId = savingsAccountCount;
        savingsPlans[planId] = SavingsPlan({
            isEther: _isEther,
            token: _isEther ? address(0) : _token,
            balance: 0,
            lockPeriod: _lockPeriod,
            startTime: block.timestamp
        });
        savingsPlanIds.push(planId);
        savingsAccountCount++;

        if (_isEther && msg.value > 0) {
            savingsPlans[planId].balance += msg.value;
        }
    }

    function deposit(uint256 _planId, uint256 _amount) external payable {
        require(msg.sender == owner, "Only owner can deposit");
        require(_planId < savingsAccountCount, "Invalid savings plan");

        SavingsPlan storage plan = savingsPlans[_planId];

        if (plan.isEther) {
            require(msg.value == _amount, "Incorrect Ether amount");
            plan.balance += msg.value;
        } else {
            require(msg.value == 0, "No Ether needed for ERC20 deposit");
            require(_amount > 0, "Amount must be greater than 0");
            IERC20(plan.token).transferFrom(msg.sender, address(this), _amount);
            plan.balance += _amount;
        }
    }

    function withdraw(uint256 _planId, uint256 _amount) external {
        require(msg.sender == owner, "Only owner can withdraw");
        require(_planId < savingsAccountCount, "Invalid savings plan");
        SavingsPlan storage plan = savingsPlans[_planId];
        require(_amount <= plan.balance, "Insufficient balance");

        bool isLocked = block.timestamp < plan.startTime + plan.lockPeriod;
        address admin = IPiggyBankFactory(factory).admin();
        uint256 penalty = 0;

        if (isLocked) {
            penalty = (_amount * 3) / 100;
            require(_amount >= penalty, "Amount too small for penalty");
        }

        plan.balance -= _amount;

        if (plan.isEther) {
            if (isLocked) {
                payable(admin).transfer(penalty);
                payable(owner).transfer(_amount - penalty);
            } else {
                payable(owner).transfer(_amount);
            }
        } else {
            if (isLocked) {
                IERC20(plan.token).transfer(admin, penalty);
                IERC20(plan.token).transfer(owner, _amount - penalty);
            } else {
                IERC20(plan.token).transfer(owner, _amount);
            }
        }
    }

    function getBalance(uint256 _planId) external view returns (uint256) {
        require(_planId < savingsAccountCount, "Invalid savings plan");
        return savingsPlans[_planId].balance;
    }

    function getLockPeriod(uint256 _planId) external view returns (uint256, uint256) {
        require(_planId < savingsAccountCount, "Invalid savings plan");
        SavingsPlan memory plan = savingsPlans[_planId];
        return (plan.lockPeriod, plan.startTime);
    }
}