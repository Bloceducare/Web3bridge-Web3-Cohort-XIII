// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract PiggyBank is ReentrancyGuard {
    address private constant NATIVE_TOKEN = address(0);

    struct SavingsPlan {
        address token; // address(0) for ETH, ERC20 address otherwise
        uint256 balance;
        uint256 lockPeriod;
        uint256 startTime;
    }

    address public owner;
    address public factoryAdmin;
    uint256 public earlyWithdrawalFeeBps; // Fee in basis points (e.g., 300 for 3%)
    SavingsPlan[] public plans;

    event PlanCreated(uint256 indexed planId, address token, uint256 lockPeriodInSeconds);
    event Deposited(uint256 indexed planId, uint256 amount);
    event Withdrawn(uint256 indexed planId, uint256 amount, uint256 payout, uint256 fee);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _owner, address _factoryAdmin) {
        owner = _owner;
        factoryAdmin = _factoryAdmin;
        earlyWithdrawalFeeBps = 300; // Default to 3%
    }

    function createPlan(address token, uint256 lockPeriodInDays) external onlyOwner returns (uint256) {
        uint256 lockPeriodInSeconds = lockPeriodInDays * 1 days;

        plans.push(SavingsPlan({
            token: token,
            balance: 0,
            lockPeriod: lockPeriodInSeconds,
            startTime: block.timestamp
        }));

        emit PlanCreated(plans.length - 1, token, lockPeriodInSeconds);
        return plans.length - 1;
    }

    function deposit(uint256 planId, uint256 amount) external payable onlyOwner nonReentrant {
        SavingsPlan storage plan = plans[planId];
        if (plan.token == NATIVE_TOKEN) {
            require(msg.value == amount, "ETH amount mismatch");
            plan.balance += amount;
        } else {
            require(msg.value == 0, "No ETH allowed for ERC20");
            require(IERC20(plan.token).transferFrom(msg.sender, address(this), amount), "ERC20 transfer failed");
            plan.balance += amount;
        }
        emit Deposited(planId, amount);
    }

    function withdraw(uint256 planId, uint256 amount) external onlyOwner nonReentrant {
        SavingsPlan storage plan = plans[planId];
        require(plan.balance >= amount, "Insufficient balance");

        uint256 unlockTime = plan.startTime + plan.lockPeriod;
        uint256 fee = 0;
        if (block.timestamp < unlockTime) {
            fee = (amount * earlyWithdrawalFeeBps) / 10000;
        }

        uint256 payout = amount - fee;

        // Checks-Effects-Interactions pattern
        plan.balance -= amount;

        emit Withdrawn(planId, amount, payout, fee);

        if (plan.token == NATIVE_TOKEN) {
            // Use .call for safer ETH transfers
            (bool success, ) = owner.call{value: payout}("");
            require(success, "ETH payout failed");
            if (fee > 0) {
                (bool feeSuccess, ) = factoryAdmin.call{value: fee}("");
                require(feeSuccess, "ETH fee transfer failed");
            }
        } else {
            require(IERC20(plan.token).transfer(owner, payout), "ERC20 payout failed");
            if (fee > 0) require(IERC20(plan.token).transfer(factoryAdmin, fee), "ERC20 fee failed");
        }
    }

    function setEarlyWithdrawalFee(uint256 _newFeeBps) external onlyOwner {
        earlyWithdrawalFeeBps = _newFeeBps;
    }

    function getPlan(uint256 planId) external view returns (address token, uint256 balance, uint256 lockPeriodInSeconds, uint256 startTime) {
        SavingsPlan storage plan = plans[planId];
        return (plan.token, plan.balance, plan.lockPeriod, plan.startTime);
    }

    function getPlansCount() external view returns (uint256) {
        return plans.length;
    }

    function getBalance(uint256 planId) external view returns (uint256) {
        return plans[planId].balance;
    }
}
