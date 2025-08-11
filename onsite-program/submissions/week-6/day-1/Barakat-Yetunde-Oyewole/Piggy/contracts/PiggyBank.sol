// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IPiggyBankFactory.sol";

contract PiggyBank is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    address public factory;
    address public owner;
    uint256 public totalSavingsPlans;
    
    struct SavingsPlan {
        uint256 id;
        address token;
        uint256 amount;
        uint256 lockPeriod;
        uint256 depositTime;
        bool isActive;
        string planName;
    }
    
    mapping(uint256 => SavingsPlan) public savingsPlans;
    
    event SavingsPlanCreated(
        uint256 indexed planId, 
        address indexed token, 
        uint256 amount, 
        uint256 lockPeriod,
        string planName
    );
    event Withdrawal(
        uint256 indexed planId, 
        uint256 amount, 
        bool earlyWithdrawal, 
        uint256 fee
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    modifier onlyFactory() {
        require(msg.sender == factory, "Not the factory");
        _;
    }
    
    constructor(address _owner, address _factory) {
        owner = _owner;
        factory = _factory;
    }
    
    function createSavingsPlan(
        address _token,
        uint256 _amount,
        uint256 _lockPeriod,
        string memory _planName
    ) external payable onlyOwner nonReentrant {
        require(_lockPeriod > 0, "Lock period must be greater than 0");
        require(_amount > 0, "Amount must be greater than 0");
        require(bytes(_planName).length > 0, "Plan name cannot be empty");
        
        if (_token == address(0)) {
            require(msg.value == _amount, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "Should not send ETH for ERC20");
            IERC20(_token).safeTransferFrom(owner, address(this), _amount);
        }
        
        totalSavingsPlans++;
        savingsPlans[totalSavingsPlans] = SavingsPlan({
            id: totalSavingsPlans,
            token: _token,
            amount: _amount,
            lockPeriod: _lockPeriod,
            depositTime: block.timestamp,
            isActive: true,
            planName: _planName
        });
        
        emit SavingsPlanCreated(totalSavingsPlans, _token, _amount, _lockPeriod, _planName);
        IPiggyBankFactory(factory).notifyNewSavingsPlan(owner);
    }
    
    function withdraw(uint256 _planId) external onlyOwner nonReentrant {
        require(_planId > 0 && _planId <= totalSavingsPlans, "Invalid plan ID");
        SavingsPlan storage plan = savingsPlans[_planId];
        require(plan.isActive, "Plan is not active");
        
        uint256 unlockTime = plan.depositTime + plan.lockPeriod;
        bool isEarlyWithdrawal = block.timestamp < unlockTime;
        uint256 withdrawAmount = plan.amount;
        uint256 fee = 0;
        
        if (isEarlyWithdrawal) {
            fee = (plan.amount * 3) / 100;
            withdrawAmount = plan.amount - fee;
            address factoryAdmin = IPiggyBankFactory(factory).admin();
            if (plan.token == address(0)) {
                payable(factoryAdmin).transfer(fee);
            } else {
                IERC20(plan.token).safeTransfer(factoryAdmin, fee);
            }
        }
        
        if (plan.token == address(0)) {
            payable(owner).transfer(withdrawAmount);
        } else {
            IERC20(plan.token).safeTransfer(owner, withdrawAmount);
        }
        
        plan.isActive = false;
        emit Withdrawal(_planId, withdrawAmount, isEarlyWithdrawal, fee);
    }
    
    function getSavingsPlan(uint256 _planId) external view returns (SavingsPlan memory) {
        require(_planId > 0 && _planId <= totalSavingsPlans, "Invalid plan ID");
        return savingsPlans[_planId];
    }
    
    function getActiveSavingsPlans() external view returns (SavingsPlan[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= totalSavingsPlans; i++) {
            if (savingsPlans[i].isActive) {
                activeCount++;
            }
        }
        SavingsPlan[] memory activePlans = new SavingsPlan[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= totalSavingsPlans; i++) {
            if (savingsPlans[i].isActive) {
                activePlans[index] = savingsPlans[i];
                index++;
            }
        }
        return activePlans;
    }
    
    function getTokenBalance(address _token) external view returns (uint256) {
        if (_token == address(0)) {
            return address(this).balance;
        } else {
            return IERC20(_token).balanceOf(address(this));
        }
    }
    
    function canWithdrawWithoutPenalty(uint256 _planId) external view returns (bool) {
        require(_planId > 0 && _planId <= totalSavingsPlans, "Invalid plan ID");
        SavingsPlan memory plan = savingsPlans[_planId];
        if (!plan.isActive) return false;
        return block.timestamp >= (plan.depositTime + plan.lockPeriod);
    }
    
    function getTimeRemaining(uint256 _planId) external view returns (uint256) {
        require(_planId > 0 && _planId <= totalSavingsPlans, "Invalid plan ID");
        SavingsPlan memory plan = savingsPlans[_planId];
        if (!plan.isActive) return 0;
        uint256 unlockTime = plan.depositTime + plan.lockPeriod;
        if (block.timestamp >= unlockTime) return 0;
        return unlockTime - block.timestamp;
    }
    
    function getUnlockTime(uint256 _planId) external view returns (uint256) {
        require(_planId > 0 && _planId <= totalSavingsPlans, "Invalid plan ID");
        SavingsPlan memory plan = savingsPlans[_planId];
        return plan.depositTime + plan.lockPeriod;
    }
    
    function calculateEarlyWithdrawalFee(uint256 _planId) external view returns (uint256) {
        require(_planId > 0 && _planId <= totalSavingsPlans, "Invalid plan ID");
        SavingsPlan memory plan = savingsPlans[_planId];
        if (!plan.isActive) return 0;
        if (block.timestamp >= (plan.depositTime + plan.lockPeriod)) return 0;
        return (plan.amount * 3) / 100;
    }
}
