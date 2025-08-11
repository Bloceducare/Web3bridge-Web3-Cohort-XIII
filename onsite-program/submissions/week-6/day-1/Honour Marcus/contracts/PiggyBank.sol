// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PiggyBank is Ownable, ReentrancyGuard {
    struct SavingsPlan {
        address tokenAddress;  
        uint256 amount;        
        uint256 lockEndTime;   
        uint256 lockPeriod;    
        bool withdrawn;        
    }

    SavingsPlan[] public plans;
    address public factoryOwner; 

    event Deposit(address indexed user, uint256 indexed planId, address token, uint256 amount, uint256 lockEndTime);
    event Withdraw(address indexed user, uint256 indexed planId, uint256 amount, bool earlyWithdrawal);

    modifier onlyUser() {
        require(msg.sender == owner(), "Not your PiggyBank");
        _;
    }

    constructor(address _user, address _factoryOwner) Ownable(_user) {
        factoryOwner = _factoryOwner;
    }

    function depositETH(uint256 _lockPeriod) external payable onlyUser {
        require(msg.value > 0, "No ETH sent");
        for (uint i = 0; i < plans.length; i++) {
            require(_lockPeriod != plans[i].lockPeriod, "Lock period must be unique");
        }
        uint256 lockEnd = block.timestamp + _lockPeriod;
        plans.push(SavingsPlan(address(0), msg.value, lockEnd, _lockPeriod, false)); 
        emit Deposit(msg.sender, plans.length - 1, address(0), msg.value, lockEnd);
    }

    function depositToken(address _token, uint256 _amount, uint256 _lockPeriod) external onlyUser nonReentrant {
        require(_amount > 0, "Invalid amount");
        for (uint i = 0; i < plans.length; i++) {
            require(_lockPeriod != plans[i].lockPeriod, "Lock period must be unique");
        }
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        uint256 lockEnd = block.timestamp + _lockPeriod;
        plans.push(SavingsPlan(_token, _amount, lockEnd, _lockPeriod, false)); 
        emit Deposit(msg.sender, plans.length - 1, _token, _amount, lockEnd);
    }

    function withdraw(uint256 _planId) external onlyUser nonReentrant {
        require(_planId < plans.length, "Invalid plan");
        SavingsPlan storage plan = plans[_planId];
        require(!plan.withdrawn, "Already withdrawn");

        uint256 fee = 0;
        uint256 amountToUser = plan.amount;

        if (block.timestamp < plan.lockEndTime) {
            fee = (plan.amount * 3) / 100;
            amountToUser = plan.amount - fee;
        }

        plan.withdrawn = true;

        if (plan.tokenAddress == address(0)) {
            if (fee > 0) payable(factoryOwner).transfer(fee);
            payable(msg.sender).transfer(amountToUser);
        } else {
            if (fee > 0) IERC20(plan.tokenAddress).transfer(factoryOwner, fee);
            IERC20(plan.tokenAddress).transfer(msg.sender, amountToUser);
        }

        emit Withdraw(msg.sender, _planId, amountToUser, fee > 0);
    }
}
