// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IPiggyBank.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

    error InsufficientBalance();
    error LockPeriodNotExpired();
    error InvalidAmount();
    error TransferFailed();


contract PiggyBank is IPiggyBank, Ownable {

    address public immutable factory;
    address public immutable admin;

    mapping(uint256 => SavingsPlan) public savingsPlans;
    uint256 public planCount;

    uint256 public constant PENALTY_FEE = 3;

    constructor(address _admin, address _owner) Ownable(_owner) {
        factory = msg.sender;
        admin = _admin;
    }

    function depositEther(uint256 lockPeriod) external payable override {
        if (msg.value == 0) revert InvalidAmount();
        uint256 planId = planCount++;
        savingsPlans[planId] = SavingsPlan({
            balance: msg.value,
            lockPeriod: lockPeriod,
            startTime: block.timestamp,
            isEther: true,
            token: address(0)
        });
        emit SavingsPlanCreated(planId, lockPeriod, true, address(0));
        emit Deposited(msg.sender, msg.value, true, address(0), lockPeriod);
    }

    function depositToken(address token, uint256 amount, uint256 lockPeriod) external override {
        if (amount == 0) revert InvalidAmount();
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        uint256 planId = planCount++;
        savingsPlans[planId] = SavingsPlan({
            balance: amount,
            lockPeriod: lockPeriod,
            startTime: block.timestamp,
            isEther: false,
            token: token
        });
        emit SavingsPlanCreated(planId, lockPeriod, false, token);
        emit Deposited(msg.sender, amount, false, token, lockPeriod);
    }

    function withdraw(uint256 planId) external override {
        SavingsPlan storage plan = savingsPlans[planId];
        if (plan.balance == 0) revert InsufficientBalance();

        uint256 amount = plan.balance;
        bool isEarly = block.timestamp < plan.startTime + plan.lockPeriod;
        uint256 penalty = isEarly ? (amount * PENALTY_FEE) / 100 : 0;
        uint256 amountToUser = amount - penalty;

        plan.balance = 0;

        if (plan.isEther) {
            if (penalty > 0) {
                (bool sentPenalty, ) = admin.call{value: penalty}("");
                if (!sentPenalty) revert TransferFailed();
            }
            (bool sent, ) = msg.sender.call{value: amountToUser}("");
            if (!sent) revert TransferFailed();
        } else {
            if (penalty > 0) {
                IERC20(plan.token).transfer(admin, penalty);
            }
            IERC20(plan.token).transfer(msg.sender, amountToUser);
        }

        emit Withdrawn(msg.sender, amountToUser, plan.isEther, plan.token, penalty);
    }

    function getBalance(uint256 planId) external view override returns (uint256) {
        return savingsPlans[planId].balance;
    }

    function getSavingsPlan(uint256 planId) external view override returns (SavingsPlan memory) {
        return savingsPlans[planId];
    }
}