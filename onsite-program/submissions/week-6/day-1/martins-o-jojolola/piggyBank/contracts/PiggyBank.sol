// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interface/IPiggyBank.sol";
import "./lib/Errors.sol";

contract PiggyBank is ReentrancyGuard, IPiggyBank {
    using Errors for *;

    struct SavingsPlan {
        uint256 amount;
        address token;
        uint256 lockPeriod;
        uint256 unlockTime;
        bool isActive;
        bool isETH;
    }

    address public owner;
    address public admin;
    uint256 public planCounter;

    mapping(uint256 => SavingsPlan) public savingsPlans;

    uint256 public constant BREAKING_FEE = 300;
    uint256 public constant BP_DENOM = 10_000;

    event PlanCreated(
        uint256 indexed planId,
        address indexed token,
        uint256 lockPeriod
    );
    event Deposit(uint256 indexed planId, address indexed who, uint256 amount);
    event Withdraw(
        uint256 indexed planId,
        address indexed who,
        uint256 amount,
        uint256 fee
    );

    constructor(address _owner, address _admin) {
        if (_owner == address(0) || _admin == address(0))
            revert Errors.InvalidAddress();
        owner = _owner;
        admin = _admin;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Errors.NotOwner();
        _;
    }

    modifier validPlan(uint256 planId) {
        if (!savingsPlans[planId].isActive) revert Errors.InvalidPlan();
        _;
    }

    function createSavingsPlan(
        address token,
        uint256 lockPeriod
    ) external override onlyOwner returns (uint256) {
        if (lockPeriod == 0) revert Errors.InvalidLockPeriod();

        planCounter++;
        uint256 planId = planCounter;

        savingsPlans[planId] = SavingsPlan({
            amount: 0,
            token: token,
            lockPeriod: lockPeriod,
            unlockTime: 0,
            isActive: true,
            isETH: (token == address(0))
        });

        emit PlanCreated(planId, token, lockPeriod);
        return planId;
    }

    function depositETH(
        uint256 planId
    ) external payable override onlyOwner nonReentrant validPlan(planId) {
        SavingsPlan storage plan = savingsPlans[planId];

        if (!plan.isETH) revert Errors.NotETHMode();
        if (msg.value == 0) revert Errors.ZeroDeposit();

        if (plan.amount == 0) {
            plan.unlockTime = block.timestamp + plan.lockPeriod;
        }

        plan.amount += msg.value;
        emit Deposit(planId, msg.sender, msg.value);
    }

    function depositERC20(
        uint256 planId,
        uint256 amount
    ) external override onlyOwner nonReentrant validPlan(planId) {
        SavingsPlan storage plan = savingsPlans[planId];

        if (plan.isETH) revert Errors.NotERC20Mode();
        if (amount == 0) revert Errors.ZeroDeposit();

        IERC20 token = IERC20(plan.token);
        if (!token.transferFrom(msg.sender, address(this), amount))
            revert Errors.TransferFailed();

        if (plan.amount == 0) {
            plan.unlockTime = block.timestamp + plan.lockPeriod;
        }

        plan.amount += amount;
        emit Deposit(planId, msg.sender, amount);
    }

    function withdraw(
        uint256 planId,
        uint256 amount
    ) public override nonReentrant onlyOwner validPlan(planId) {
        SavingsPlan storage plan = savingsPlans[planId];

        if (amount == 0) revert Errors.ZeroWithdraw();
        if (amount > plan.amount) revert Errors.InsufficientBalance();

        bool beforeUnlock = block.timestamp < plan.unlockTime;
        uint256 fee = beforeUnlock ? (amount * BREAKING_FEE) / BP_DENOM : 0;
        uint256 payout = amount - fee;

        plan.amount -= amount;

        if (plan.isETH) {
            if (payout > 0) _safeETHTransfer(owner, payout);
            if (fee > 0) _safeETHTransfer(admin, fee);
        } else {
            IERC20 token = IERC20(plan.token);
            if (payout > 0 && !token.transfer(owner, payout))
                revert Errors.TransferFailed();
            if (fee > 0 && !token.transfer(admin, fee))
                revert Errors.TransferFailed();
        }

        emit Withdraw(planId, msg.sender, payout, fee);
    }

    function withdrawAll(uint256 planId) external override onlyOwner {
        withdraw(planId, savingsPlans[planId].amount);
    }

    function getTotalBalance()
        external
        view
        override
        returns (
            uint256 ethTotal,
            address[] memory tokenAddresses,
            uint256[] memory tokenBalances
        )
    {
        address[] memory uniqueTokens = new address[](planCounter);
        uint256[] memory tempBalances = new uint256[](planCounter);
        uint256 tokenCount = 0;

        for (uint256 i = 1; i <= planCounter; i++) {
            if (!savingsPlans[i].isActive) continue;

            SavingsPlan memory plan = savingsPlans[i];

            if (plan.isETH) {
                ethTotal += plan.amount;
            } else {
                // Check if token already exists
                bool found = false;
                for (uint256 j = 0; j < tokenCount; j++) {
                    if (uniqueTokens[j] == plan.token) {
                        tempBalances[j] += plan.amount;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    uniqueTokens[tokenCount] = plan.token;
                    tempBalances[tokenCount] = plan.amount;
                    tokenCount++;
                }
            }
        }
        tokenAddresses = new address[](tokenCount);
        tokenBalances = new uint256[](tokenCount);

        for (uint256 i = 0; i < tokenCount; i++) {
            tokenAddresses[i] = uniqueTokens[i];
            tokenBalances[i] = tempBalances[i];
        }
    }

    function getPlanDetails(
        uint256 planId
    )
        external
        view
        override
        returns (
            uint256 amount,
            address token,
            uint256 lockPeriod,
            uint256 unlockTime,
            bool isActive,
            bool isETH
        )
    {
        SavingsPlan memory plan = savingsPlans[planId];
        return (
            plan.amount,
            plan.token,
            plan.lockPeriod,
            plan.unlockTime,
            plan.isActive,
            plan.isETH
        );
    }

    function getAllPlans()
        external
        view
        override
        returns (
            uint256[] memory planIds,
            uint256[] memory amounts,
            address[] memory tokens,
            uint256[] memory lockPeriods,
            uint256[] memory unlockTimes,
            bool[] memory isActiveArray,
            bool[] memory isETHArray
        )
    {
        uint256 activeCount = 0;

        for (uint256 i = 1; i <= planCounter; i++) {
            if (savingsPlans[i].isActive) {
                activeCount++;
            }
        }

        planIds = new uint256[](activeCount);
        amounts = new uint256[](activeCount);
        tokens = new address[](activeCount);
        lockPeriods = new uint256[](activeCount);
        unlockTimes = new uint256[](activeCount);
        isActiveArray = new bool[](activeCount);
        isETHArray = new bool[](activeCount);

        uint256 index = 0;
        for (uint256 i = 1; i <= planCounter; i++) {
            if (savingsPlans[i].isActive) {
                SavingsPlan memory plan = savingsPlans[i];
                planIds[index] = i;
                amounts[index] = plan.amount;
                tokens[index] = plan.token;
                lockPeriods[index] = plan.lockPeriod;
                unlockTimes[index] = plan.unlockTime;
                isActiveArray[index] = plan.isActive;
                isETHArray[index] = plan.isETH;
                index++;
            }
        }
    }

    function getPlanCount() external view override returns (uint256) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= planCounter; i++) {
            if (savingsPlans[i].isActive) {
                activeCount++;
            }
        }
        return activeCount;
    }

    function isLocked(uint256 planId) external view override returns (bool) {
        if (!savingsPlans[planId].isActive) return false;
        return block.timestamp < savingsPlans[planId].unlockTime;
    }

    function getTimeRemaining(
        uint256 planId
    ) external view override returns (uint256) {
        if (!savingsPlans[planId].isActive) return 0;
        if (block.timestamp >= savingsPlans[planId].unlockTime) return 0;
        return savingsPlans[planId].unlockTime - block.timestamp;
    }

    function adminRescue(address to, uint256 amount, address token) external {
        if (msg.sender != admin) revert Errors.RescueNotAdmin();
        if (to == address(0)) revert Errors.InvalidAddress();

        if (token == address(0)) {
            _safeETHTransfer(to, amount);
        } else {
            IERC20 tokenContract = IERC20(token);
            if (!tokenContract.transfer(to, amount))
                revert Errors.TransferFailed();
        }
    }

    function _safeETHTransfer(address to, uint256 amount) internal {
        (bool ok, ) = payable(to).call{value: amount}("");
        if (!ok) revert Errors.TransferFailed();
    }

    receive() external payable {
        revert Errors.DirectETHNotAllowed();
    }
}
