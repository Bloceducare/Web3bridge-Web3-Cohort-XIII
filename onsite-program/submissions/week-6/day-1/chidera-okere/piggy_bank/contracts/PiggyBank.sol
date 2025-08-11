// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../interfaces/IErc_20.sol";
import "./PiggyBank.sol";

interface IPiggyBankFactory {
    function admin() external view returns (address);
}

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
    }

    address public owner;
    address public factory;

    
    mapping(address => SavingsPlan[]) public userToSavingsPlan;

    // simple reentrancy guard
    uint8 private _locked;

    modifier onlyOwner() {
        require(owner == msg.sender, "Not_Owner");
        _;
    }

    modifier nonReentrant() {
        require(_locked == 0, "reentrant");
        _locked = 1;
        _;
        _locked = 0;
    }


    constructor(address _owner, address _factory) {
        require(_owner != address(0) && _factory != address(0), "zero address");
        owner = _owner;
        factory = _factory;
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

    function hasLockPeriod(address user, LockTime lockTime) internal view returns (bool) {
        SavingsPlan[] memory plans = userToSavingsPlan[user];
        for (uint i = 0; i < plans.length; i++) {
            if (plans[i].active && plans[i].lockTime == lockTime) {
                return true;
            }
        }
        return false;
    }

    /// Create a savings plan. ONLY owner of this PiggyBank can call.
    /// _token == address(0) -> ETH deposit (msg.value carries)
    function create_savings_account(address _token, uint256 _amount, LockTime _lockTime) external payable onlyOwner nonReentrant {
        uint256 actualAmount;

        if (_token == address(0)) {
            require(msg.value > 0, "Must send ETH");
            actualAmount = msg.value;
        } else {
            require(msg.value == 0, "Don't send ETH for token deposit");
            require(_amount > 0, "Amount must be > 0");
            // check return value
            require(IErc_20(_token).transferFrom(msg.sender, address(this), _amount), "transferFrom failed");
            actualAmount = _amount;
        }

        require(!hasLockPeriod(msg.sender, _lockTime), "Already have savings with this lock period");

        uint256 lockDays = getLockDays(_lockTime);
        uint256 lockUntil = block.timestamp + (lockDays * 1 days);
        uint256 interest = calculateInterest(_lockTime, actualAmount);

        SavingsPlan memory newPlan = SavingsPlan({
            amount: actualAmount,
            token: _token,
            lockTime: _lockTime,
            lockUntil: lockUntil,
            interest: interest,
            active: true
        });

        userToSavingsPlan[msg.sender].push(newPlan);

    }

    /// Withdraw plan at index. onlyOwner of this piggy bank may withdraw.
  function withdraw(uint256 _index) external onlyOwner nonReentrant {
    require(_index < userToSavingsPlan[msg.sender].length, "Invalid plan");
    SavingsPlan storage plan = userToSavingsPlan[msg.sender][_index];
    require(plan.active, "Plan not active");

    // effects first: mark inactive to prevent reentrancy
    plan.active = false;

    uint256 withdrawAmount = plan.amount;
    bool early = block.timestamp < plan.lockUntil;
    uint256 fee = 0;

    if (early) {
        fee = (plan.amount * 3) / 100; // 3%
        withdrawAmount = plan.amount - fee;
    } else {
        // IMPORTANT: Only pay interest if contract has enough balance
        // In a real system, you'd fund this separately or use a different mechanism
        uint256 totalWithInterest = plan.amount + plan.interest;
        
        if (plan.token == address(0)) {
            // For ETH, check if contract has enough balance
            if (address(this).balance >= totalWithInterest) {
                withdrawAmount = totalWithInterest;
            } else {
                withdrawAmount = plan.amount; // Just return principal
            }
        } else {
            // For tokens, just return principal + interest (assuming contract was funded)
            withdrawAmount = totalWithInterest;
        }
    }

    // perform transfers (interactions)
    address admin = IPiggyBankFactory(factory).admin();

    if (plan.token == address(0)) {
        // ETH paths — use call and require success
        if (fee > 0) {
            (bool sentFee, ) = payable(admin).call{value: fee}("");
            require(sentFee, "admin fee send failed");
        }
        (bool sentOwner, ) = payable(msg.sender).call{value: withdrawAmount}("");
        require(sentOwner, "owner send failed");
    } else {
        // ERC20 paths — check return values
        if (fee > 0) {
            require(IErc_20(plan.token).transfer(admin, fee), "fee transfer failed");
        }
        require(IErc_20(plan.token).transfer(msg.sender, withdrawAmount), "owner transfer failed");
    }
}

    // Get total balance for a user (all active plans combined)
    function getUserTotalBalance(address user) external view returns (uint256 ethBalance, uint256[] memory tokenBalances, address[] memory tokens) {
        SavingsPlan[] memory plans = userToSavingsPlan[user];
        uint256 ethTotal = 0;

        // Count unique tokens first
        address[] memory uniqueTokens = new address[](plans.length);
        uint256[] memory tokenTotals = new uint256[](plans.length);
        uint256 tokenCount = 0;

        for (uint i = 0; i < plans.length; i++) {
            if (!plans[i].active) continue;

            if (plans[i].token == address(0)) {
                ethTotal += plans[i].amount;
            } else {
                // Find or add token
                bool found = false;
                for (uint j = 0; j < tokenCount; j++) {
                    if (uniqueTokens[j] == plans[i].token) {
                        tokenTotals[j] += plans[i].amount;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    uniqueTokens[tokenCount] = plans[i].token;
                    tokenTotals[tokenCount] = plans[i].amount;
                    tokenCount++;
                }
            }
        }

        ethBalance = ethTotal;
        tokens = new address[](tokenCount);
        tokenBalances = new uint256[](tokenCount);
        for (uint i = 0; i < tokenCount; i++) {
            tokens[i] = uniqueTokens[i];
            tokenBalances[i] = tokenTotals[i];
        }
    }

    function getUserSavingsPlans(address user) external view returns (SavingsPlan[] memory) {
        return userToSavingsPlan[user];
    }

    function getUserActivePlansCount(address user) external view returns (uint256) {
        SavingsPlan[] memory plans = userToSavingsPlan[user];
        uint256 count = 0;
        for (uint i = 0; i < plans.length; i++) {
            if (plans[i].active) count++;
        }
        return count;
    }

    // allow contract to receive ETH for ETH-plan deposits via direct transfer
    receive() external payable {}
    fallback() external payable {}
}