// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../interfaces/IErc_20.sol";
import "./PiggyBankFactory.sol";

contract PiggyBank {
    enum LockTime {
        WEEKLY,
        MONTHLY,
        YEARLY
    }

    struct SavingsPlan {
        uint256 amount;
        address token;
        LockTime lockTime;
        uint256 lockUntil;
        uint256 interest;
        bool active;
        bool isLocked;
    }

    address public owner;
    address public factory;
    SavingsPlan[] public savingsPlans;

    mapping(address => SavingsPlan[]) public userToSavingsPlan;

    constructor(address _owner, address _factory) {
        owner = _owner;
        factory = _factory;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Not_Owner");
        _;
    }

    function getLockDays(LockTime _lockTime) internal pure returns (uint256) {
        if (_lockTime == LockTime.WEEKLY) return 7;
        if (_lockTime == LockTime.MONTHLY) return 30;
        if (_lockTime == LockTime.YEARLY) return 365;
        return 0;
    }

    function calculateInterest(LockTime _lockTime, uint256 _amount) internal pure returns (uint256) {
        uint256 rate;
        if (_lockTime == LockTime.WEEKLY) rate = 1;
        else if (_lockTime == LockTime.MONTHLY) rate = 5;
        else if (_lockTime == LockTime.YEARLY) rate = 10;
        return (_amount * rate) / 100;
    }

    function create_savings_account(address _token, uint256 _amount, LockTime _lockTime) external payable {
        uint256 actualAmount;

        if (_token == address(0)) {
            require(msg.value > 0, "Must send ETH");
            actualAmount = msg.value;
        } else {
            require(msg.value == 0, "Don't send ETH for token deposit");
            require(_amount > 0, "Amount must be > 0");
            IErc_20(_token).transferFrom(msg.sender, address(this), _amount);
            actualAmount = _amount;
        }

        uint256 lockDays = getLockDays(_lockTime);
        uint256 lockUntil = block.timestamp + (lockDays * 1 days);

        SavingsPlan memory newPlan = SavingsPlan({
            amount: actualAmount,
            token: _token,
            lockTime: _lockTime,
            lockUntil: lockUntil,
            interest: calculateInterest(_lockTime, actualAmount),
            active: true,
            isLocked: true
        });

        userToSavingsPlan[msg.sender].push(newPlan);
        savingsPlans.push(newPlan);
    }

    function withdraw(uint256 _index) external {
        require(_index < userToSavingsPlan[msg.sender].length, "Invalid plan");
        SavingsPlan storage plan = userToSavingsPlan[msg.sender][_index];
        require(plan.active, "Plan not active");

        uint256 withdrawAmount = plan.amount;

        if (block.timestamp < plan.lockUntil) {
            uint256 penalty = (plan.amount * 3) / 100;
            withdrawAmount -= penalty;

            if (plan.token == address(0)) {
                payable(PiggyBankFactory(factory).admin()).transfer(penalty);
                payable(msg.sender).transfer(withdrawAmount);
            } else {
                IErc_20(plan.token).transfer(PiggyBankFactory(factory).admin(), penalty);
                IErc_20(plan.token).transfer(msg.sender, withdrawAmount);
            }
        } else {
            withdrawAmount = plan.amount + plan.interest;
            if (plan.token == address(0)) {
                payable(msg.sender).transfer(withdrawAmount);
            } else {
                IErc_20(plan.token).transfer(msg.sender, withdrawAmount);
            }
        }

        plan.active = false;
    }


    receive() external payable {}

    fallback() external payable {}

}
